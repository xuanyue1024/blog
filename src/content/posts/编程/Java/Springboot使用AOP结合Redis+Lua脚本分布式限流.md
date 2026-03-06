---
author: 竹林听雨
tags:
  - JavaWeb
  - 分布式
  - 面试
title: Springboot使用AOP结合Redis+Lua脚本分布式限流
abbrlink: 2e06b5c8
published: 2025-08-16 00:00:00
sticky: 100
---
### 1.定义一个限流注解，方便AOP调用
```Java
@Target(ElementType.METHOD)  
@Retention(RetentionPolicy.RUNTIME)  
@Documented  
public @interface RateLimiter {  
    long DEFAULT_REQUEST = 10;  
  
    /**  
     * max 最大请求数  
     */  
    @AliasFor("max") long value() default DEFAULT_REQUEST;  
  
    /**  
     * max 最大请求数  
     */  
    @AliasFor("value") long max() default DEFAULT_REQUEST;  
    //上方写两次是为了等值使用，添加了 AliasFor 必须通过 AnnotationUtils 获取，才会生效  
  
    /**  
     * 限流key  
     */    String key() default "";  
  
    /**  
     * 超时时长，默认1分钟  
     */  
    long timeout() default 1;  
  
    /**  
     * 超时时间单位，默认 分钟  
     */  
    TimeUnit timeUnit() default TimeUnit.MINUTES;  
}
```

### 2.切面类
定义切点表达式，创建pointcut方法，通过方法形参point传入，获取到方法后，通过AnnotationUtils获取方法所携带的注解及其参数，获取最大访问次数max、超时时间timeout，以及时间格式timeUnit，把参数交给限流方法，计算出窗口时间范围expired到now，交给Lua脚本执行

```Java
@Slf4j  
@Aspect  
@Component  
@RequiredArgsConstructor()  
public class RateLimiterAspect {  
    private final static String SEPARATOR = ":";  
    private final static String REDIS_LIMIT_KEY_PREFIX = "limit:";  
    private final StringRedisTemplate stringRedisTemplate;  
    private final RedisScript<Long> limitRedisScript;  
  
    @Pointcut("@annotation(com.xkcoding.ratelimit.redis.annotation.RateLimiter)")  
    public void rateLimit() {  
  
    }  
  
    @Around("rateLimit()")  
    public Object pointcut(ProceedingJoinPoint point) throws Throwable {  
        MethodSignature signature = (MethodSignature) point.getSignature();  
        Method method = signature.getMethod();  
        // 通过 AnnotationUtils.findAnnotation 获取 RateLimiter 注解  
        RateLimiter rateLimiter = AnnotationUtils.findAnnotation(method, RateLimiter.class);  
        if (rateLimiter != null) {  
            String key = rateLimiter.key();  
            // 默认用类名+方法名做限流的 key 前缀  
            if (StrUtil.isBlank(key)) {  
                key = method.getDeclaringClass().getName() + StrUtil.DOT + method.getName();  
            }  
            // 最终限流的 key 为 前缀 + IP地址  
            // TODO: 此时需要考虑局域网多用户访问的情况，因此 key 后续需要加上方法参数更加合理 ，其实就是：当前限流 key 只包含了“自定义 key 或类名.方法名”和“IP 地址”，但在局域网环境下，多个用户可能共用同一个外网 IP，导致限流不够精确。为了解决这个问题，建议在 key 中加入方法参数（如用户 ID、请求参数等），这样可以更细粒度地区分不同用户或请求，避免误伤。
            key = key + SEPARATOR + IpUtil.getIpAddr();  
  
            long max = rateLimiter.max();  
            long timeout = rateLimiter.timeout();  
            TimeUnit timeUnit = rateLimiter.timeUnit();  
            boolean limited = shouldLimited(key, max, timeout, timeUnit);  
            if (limited) {  
                throw new RuntimeException("手速太快了，慢点儿吧~");  
            }  
        }  
  
        return point.proceed();  
    }  
  
    private boolean shouldLimited(String key, long max, long timeout, TimeUnit timeUnit) {  
        // 最终的 key 格式为：  
        // limit:自定义key:IP  
        // limit:类名.方法名:IP  
        key = REDIS_LIMIT_KEY_PREFIX + key;  
        // 统一使用单位毫秒  
        long ttl = timeUnit.toMillis(timeout);  
        // 当前时间毫秒数  
        long now = Instant.now().toEpochMilli();  
        long expired = now - ttl;  
        // 注意这里必须转为 String,否则会报错 java.lang.Long cannot be cast to java.lang.String  
	    Long executeTimes = stringRedisTemplate.execute(limitRedisScript, Collections.singletonList(key), now + "", ttl + "", expired + "", max + "");  
        if (executeTimes != null) {  
            if (executeTimes == 0) {  
                log.error("【{}】在单位时间 {} 毫秒内已达到访问上限，当前接口上限 {}", key, ttl, max);  
                return true;  
            } else {  
                log.info("【{}】在单位时间 {} 毫秒内访问 {} 次", key, ttl, executeTimes);  
                return false;  
            }  
        }  
        return false;  
    }  
}
```

### 3.Lua脚本
```Lua
-- 下标从 1 开始  
local key = KEYS[1]  
local now = tonumber(ARGV[1])  
local ttl = tonumber(ARGV[2])  
local expired = tonumber(ARGV[3])  
-- 最大访问量  
local max = tonumber(ARGV[4])  
  
-- 清除过期的数据  
-- 移除指定分数区间内的所有元素，expired 即已经过期的 score-- 根据当前时间毫秒数 - 超时毫秒数，得到过期时间 
expiredredis.call('zremrangebyscore', key, 0, expired)  
  
-- 获取 zset 中的当前元素个数  
local current = tonumber(redis.call('zcard', key))  
local next = current + 1  
  
if next > max then  
  -- 达到限流大小 返回 0  return 0;  
else  
  -- 往 zset 中添加一个值、得分均为当前时间戳的元素，[value,score]  
  redis.call("zadd", key, now, now)  
  -- 每次访问均重新设置 zset 的过期时间，单位毫秒  
  redis.call("pexpire", key, ttl)  
  return next  
end
```

获取参数，使用滑动窗口动态计算，首先删除不在窗口范围内的数据，然后使用计数器计算窗口内数据+当前数据总数与最大访问数据做比较，如果大于max，说明当前时间段数据超限了，返回0，不再继续访问该数据
否则就把当前数据插进去，并重新设置key过期时间（延长timeout时间），这是为了防止多个用户在访问该接口一次后再也不访问了，key永久存在，就算超时了数据也会存在，因为用户没有第二次访问数据，也就没有`移除指定分数区间内的所有元素`，是为了"僵尸Key"问题，而不是"过期数据"问题。它确保即使用户再也不访问，相关的限流Key也能在timeout后自动清理，避免Redis中累积大量无用的空Key。。顺带说一句，就算key为空他也是占内存的，Redis需要去维护，

### 4.其它
#### 为什么Redis数据结构要使用zset实现限流？
使用 ZSET 的核心原因是要实现**滑动时间窗口限流**。
##### 核心需求
限流需要判断：**在过去N秒内，是否已经有超过M次请求**

##### ZSET 的优势

###### 1. **存储时间戳**
```lua
-- ZSET 同时存储时间戳作为 value 和 score
zadd key 1697788800000 1697788800000  -- [时间戳, 时间戳]
```

###### 2. **高效清理过期数据**
```lua
-- 一条命令删除所有过期请求记录
redis.call('zremrangebyscore', key, 0, expired)
```

###### 3. **快速统计当前请求数**
```lua
-- 直接获取有效请求数量
local current = redis.call('zcard', key)
```

##### 对比其他方案
**STRING 计数器：** 只能固定时间窗口，无法滑动
**LIST：** 清理过期数据效率低，需要逐个检查
**HASH：** 需要手动维护时间字段，复杂度高

##### 实现效果

```
窗口=60秒，限制=5次

时间轴: 10:00:00  10:00:30  10:01:00  10:01:10
请求:     ①②③      ④⑤       检查      ⑥

在 10:01:10 检查时：
├─ 删除 10:00:10 之前的请求 (①②③被删除)
├─ 保留 ④⑤ (在窗口内)  
├─ 当前计数=2，允许⑥通过
```

**ZSET 让滑动窗口限流变得简单高效**，这是选择它的根本原因。

#### 为什么要用lua脚本，而不是java代码实现

使用 Lua 脚本而不是 Java 代码实现限流逻辑，主要有以下几个关键原因：
##### 1. **保证操作的原子性**
说明的是，如果ip级别的限流，他们的key是各不相同的，所以用java代码实现也能保证原子性

###### Java 代码的问题（非原子性）：
```java
// ❌ 这些操作不是原子的，存在竞态条件
stringRedisTemplate.opsForZSet().removeRangeByScore(key, 0, expired);  // 操作1
Long current = stringRedisTemplate.opsForZSet().zCard(key);             // 操作2
if (current < max) {
    stringRedisTemplate.opsForZSet().add(key, now, now);                // 操作3
    stringRedisTemplate.expire(key, ttl, TimeUnit.MILLISECONDS);        // 操作4
}
```

###### 并发问题示例：
```
时间线：用户A 和 用户B 同时访问（当前计数=4，限制=5）

用户A：removeRangeByScore → current=4 → 判断通过 → [被中断]
用户B：removeRangeByScore → current=4 → 判断通过 → zadd → 计数=5
用户A：[继续] → zadd → 计数=6 ❌ 超出限制！
```

###### Lua 脚本的优势（原子性）：
```lua
-- ✅ 整个脚本作为一个原子操作执行
redis.call('zremrangebyscore', key, 0, expired)
local current = tonumber(redis.call('zcard', key))
-- 中间不会被其他请求打断
redis.call("zadd", key, now, now)
```

##### 2. **减少网络往返次数**

###### Java 代码：
```java
// ❌ 需要 3-4 次网络往返
stringRedisTemplate.opsForZSet().removeRangeByScore(key, 0, expired);  // 网络往返1
Long current = stringRedisTemplate.opsForZSet().zCard(key);             // 网络往返2
stringRedisTemplate.opsForZSet().add(key, now, now);                    // 网络往返3
stringRedisTemplate.expire(key, ttl, TimeUnit.MILLISECONDS);           // 网络往返4
```

###### Lua 脚本：
```lua
-- ✅ 只需要 1 次网络往返
-- 所有操作在 Redis 服务器端执行
```

##### 3. **性能优势**

###### 高并发场景下的差异：
```
1000个并发请求的情况：

Java 实现：
├─ 网络往返：1000 × 4 = 4000次
├─ 竞态条件：可能导致限流失效
└─ 响应时间：较慢

Lua 脚本：
├─ 网络往返：1000 × 1 = 1000次
├─ 原子操作：限流严格有效
└─ 响应时间：更快
```

##### 4. **避免分布式锁**

###### 如果用 Java 实现，需要加锁：
```java
// ❌ 复杂且性能差
String lockKey = "lock:" + key;
try {
    // 获取分布式锁
    if (redisLock.tryLock(lockKey, 100, TimeUnit.MILLISECONDS)) {
        // 执行限流逻辑
        // ...
    }
} finally {
    redisLock.unlock(lockKey);
}
```

###### Lua 脚本天然避免了这个问题：
```lua
-- ✅ 不需要显式加锁，Redis 保证脚本原子执行
```

##### 5. **事务一致性**

Lua 脚本确保限流判断和计数更新在同一个事务中：

```lua
-- 判断和操作是一体的，不会出现：
-- "判断时未超限，但执行时已超限" 的情况
if next > max then
  return 0;
else
  redis.call("zadd", key, now, now)
  return next
end
```

##### 总结

**Lua 脚本的核心优势：**
- ✅ **原子性**：避免竞态条件
- ✅ **高性能**：减少网络往返
- ✅ **简洁**：无需分布式锁
- ✅ **准确性**：严格的限流控制

### 优化：惩罚机制和风控策略
你的观点很对！当前的限流实现确实比较基础，只是简单地拒绝请求。在实际生产环境中，需要更完善的**惩罚机制**和**风控策略**。

#### 当前实现的局限性

```java
// 当前逻辑：超出限制就直接抛异常
if (limited) {
    throw new RuntimeException("手速太快了，慢点儿吧~");
}
```

问题：
- ❌ **无惩罚机制**：用户可以一直尝试
- ❌ **无封禁逻辑**：恶意用户成本很低
- ❌ **无分级处理**：所有超限都是同等处理

#### 改进方案：分级惩罚机制

##### 1. **增强的注解定义**
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimiter {
    // 原有参数
    long max() default 5;
    long timeout() default 1;
    TimeUnit timeUnit() default TimeUnit.MINUTES;
    
    // 新增惩罚机制参数
    boolean enablePunishment() default false;        // 是否启用惩罚
    long warningThreshold() default 10;              // 警告阈值
    long banThreshold() default 20;                  // 封禁阈值
    long banDuration() default 30;                   // 封禁时长
    TimeUnit banTimeUnit() default TimeUnit.MINUTES; // 封禁时间单位
}
```

##### 2. **分级处理逻辑**
```java
@Service
public class EnhancedRateLimiterService {
    
    private static final String VIOLATION_KEY_PREFIX = "violation:";
    private static final String BAN_KEY_PREFIX = "ban:";
    
    public RateLimitResult checkRateLimit(String key, RateLimiter config) {
        // 1. 检查是否被封禁
        if (isBanned(key)) {
            return RateLimitResult.banned("用户已被封禁");
        }
        
        // 2. 执行正常限流检查
        boolean normalLimited = executeNormalRateLimit(key, config);
        
        if (!normalLimited) {
            return RateLimitResult.allowed();
        }
        
        // 3. 记录违规次数
        long violationCount = recordViolation(key);
        
        // 4. 根据违规次数分级处理
        if (config.enablePunishment()) {
            return handleViolation(key, violationCount, config);
        }
        
        return RateLimitResult.rejected("请求过于频繁");
    }
    
    private RateLimitResult handleViolation(String key, long count, RateLimiter config) {
        if (count >= config.banThreshold()) {
            // 封禁用户
            banUser(key, config.banDuration(), config.banTimeUnit());
            return RateLimitResult.banned("违规次数过多，已被封禁 " + 
                config.banDuration() + " " + config.banTimeUnit().name().toLowerCase());
                
        } else if (count >= config.warningThreshold()) {
            // 警告
            return RateLimitResult.warning("警告：继续违规将被封禁，当前违规次数：" + count);
        }
        
        return RateLimitResult.rejected("请求过于频繁，违规次数：" + count);
    }
}
```

##### 3. **Lua 脚本增强**
```lua
-- enhanced_rate_limit.lua
local key = KEYS[1]
local violation_key = KEYS[2]
local ban_key = KEYS[3]

local now = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local expired = tonumber(ARGV[3])
local max = tonumber(ARGV[4])
local ban_duration = tonumber(ARGV[5])
local ban_threshold = tonumber(ARGV[6])

-- 检查是否被封禁
local ban_expire = redis.call('GET', ban_key)
if ban_expire and tonumber(ban_expire) > now then
    return {-1, tonumber(ban_expire) - now} -- 返回剩余封禁时间
end

-- 正常限流逻辑
redis.call('zremrangebyscore', key, 0, expired)
local current = tonumber(redis.call('zcard', key))

if current < max then
    redis.call("zadd", key, now, now)
    redis.call("pexpire", key, ttl)
    return {current + 1, 0}
else
    -- 记录违规
    local violation_count = redis.call('INCR', violation_key)
    redis.call('EXPIRE', violation_key, 3600) -- 违规记录1小时过期
    
    -- 检查是否需要封禁
    if violation_count >= ban_threshold then
        redis.call('SET', ban_key, now + ban_duration)
        redis.call('EXPIRE', ban_key, ban_duration / 1000)
        return {-2, ban_duration} -- 触发封禁
    end
    
    return {0, violation_count} -- 返回违规次数
end
```

##### 4. **控制器中的使用**
```java
@RestController
public class EnhancedTestController {
    
    @RateLimiter(
        max = 5, 
        timeout = 1, 
        timeUnit = TimeUnit.MINUTES,
        enablePunishment = true,
        warningThreshold = 3,
        banThreshold = 5,
        banDuration = 30,
        banTimeUnit = TimeUnit.MINUTES
    )
    @GetMapping("/test1")
    public ResponseEntity<Dict> test1() {
        return ResponseEntity.ok(
            Dict.create()
                .set("msg", "hello,world!")
                .set("description", "正常访问")
        );
    }
}
```

##### 5. **结果类型定义**
```java
@Data
@AllArgsConstructor
public class RateLimitResult {
    private boolean allowed;
    private String message;
    private long remainingTime; // 剩余封禁时间（秒）
    private int violationCount; // 违规次数
    
    public static RateLimitResult allowed() {
        return new RateLimitResult(true, "允许访问", 0, 0);
    }
    
    public static RateLimitResult banned(String message) {
        return new RateLimitResult(false, message, 0, 0);
    }
    
    public static RateLimitResult warning(String message) {
        return new RateLimitResult(true, message, 0, 0);
    }
}
```

#### 效果展示

```
用户访问轨迹：

第1-5次：正常返回数据
第6次：  "请求过于频繁，违规次数：1"
第7次：  "请求过于频繁，违规次数：2"  
第8次：  "警告：继续违规将被封禁，当前违规次数：3"
第9次：  "警告：继续违规将被封禁，当前违规次数：4"
第10次： "违规次数过多，已被封禁 30 minutes"

接下来30分钟内的所有请求：
"用户已被封禁，剩余时间：XX分钟"
```

这样的机制能够：
- ✅ **递进式惩罚**：从警告到封禁
- ✅ **震慑效果**：增加恶意访问成本  
- ✅ **保护系统**：防止资源被滥用
- ✅ **用户体验**：给正常用户提供清晰的反馈