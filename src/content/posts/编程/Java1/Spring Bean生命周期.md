---
author: 竹林听雨
tags:
  - Spring
title: Spring Bean生命周期
abbrlink: 9f2c44e1
published: 2025-09-15 13:41:43
updated: 2025-09-15 22:12:56
---
# Spring Bean 的生命周期
其实就是 **一个 Bean 从创建、初始化、使用、销毁** 的完整过程。Spring 容器（`ApplicationContext`）在管理 Bean 的过程中，会按照固定的流程来操作。下面我给你按顺序梳理一下：

---

### 1. **实例化 Instantiation**

- Spring 容器启动时，根据配置（`@Component`、`@Bean`、XML等）**通过反射调用无参构造方法**创建 Bean 实例。
    
- 如果需要参数注入，则走 **构造器注入** 或 **工厂方法**。
    

---

### 2. **属性赋值 Populate Properties**

- Spring 会通过反射或 `setXxx()` 方法，把配置文件中的属性值、依赖的 Bean 注入进去。
    
- 这一步也就是 **依赖注入（DI）**。
    

---

### 3. **Aware 接口回调**

如果 Bean 实现了某些 `Aware` 接口，Spring 会把容器信息注入进去：

- `BeanNameAware`：注入当前 Bean 的名字。
    
- `BeanFactoryAware`：注入当前 BeanFactory。
    
- `ApplicationContextAware`：注入 ApplicationContext。
    

---

### 4. **BeanPostProcessor 前置处理**

- 如果容器中有 `BeanPostProcessor`，会调用它的
    
    ```java
    postProcessBeforeInitialization(bean, beanName)
    ```
    
- 在这里你可以对 Bean 做一些“加工处理”。
    

---

### 5. **初始化 Initialization**

- 如果 Bean 实现了 `InitializingBean` 接口，会执行其 `afterPropertiesSet()` 方法。
    
- 如果 Bean 配置了 `init-method`，Spring 会调用这个方法。
    

👉 这一步就是 Bean 的 **初始化阶段**。

---

### 6. **BeanPostProcessor 后置处理**

- 初始化完成后，再次经过 `BeanPostProcessor` 的
    
    ```java
    postProcessAfterInitialization(bean, beanName)
    ```
    
- 常见用法：**AOP 动态代理** 就是在这里织入的。
    

---

### 7. **使用阶段 Bean in Use**

- 此时 Bean 就交给应用程序使用。
    
- 在整个 Spring 容器运行期间，Bean 会根据作用域（`singleton`、`prototype` 等）被使用。
    

---

### 8. **销毁 Destruction**

- 当容器关闭时（`context.close()`）：
    
    - 如果 Bean 实现了 `DisposableBean`，会调用其 `destroy()` 方法。
        
    - 如果配置了 `destroy-method`，Spring 会调用该方法。
        

👉 **注意**：`prototype` 作用域的 Bean 不会被 Spring 管理销毁，需要你自己手动清理。

---

## 总结（完整流程图）

**实例化 → 属性注入 → Aware 回调 → BeanPostProcessor 前置 → 初始化 → BeanPostProcessor 后置 → 使用 → 销毁**




## **Aware 回调 → BeanPostProcessor 前置 → 初始化 → BeanPostProcessor 后置**

这四步其实就是 **Spring 在 Bean 创建完成之后，到真正可以投入使用之前** 的一个关键环节。  
我给你拆开解释一下每一步是“干什么的”：

---

### 1. **Aware 回调**

- **目的**：让 Bean 拿到 Spring 容器里的“系统级资源”。
    
- **怎么用**：
    
    - 如果一个类实现了 `BeanNameAware`，Spring 会把当前 Bean 在容器中的名字传进去。
        
    - 如果实现了 `ApplicationContextAware`，就能直接拿到整个 `ApplicationContext`，相当于可以在 Bean 内部操作 Spring 容器。
        
- **作用**：提供一个“入口”，让 Bean 感知到自己在容器中的一些信息。
    

---

### 2. **BeanPostProcessor 前置处理**

- **方法**：`postProcessBeforeInitialization(Object bean, String beanName)`
    
- **什么时候调用**：在执行 Bean 的初始化方法之前。
    
- **作用**：
    
    - 可以对 Bean 进行“增强”或者额外处理。
        
    - 比如：给某些字段赋默认值、打印日志，甚至替换 Bean。
        
- **典型场景**：Spring 内置的注解处理（如 `@Autowired`、`@Resource`）就依赖于这个阶段。
    

---

### 3. **初始化 (Initialization)**

- **方法**：
    
    - 如果实现了 `InitializingBean` 接口 → 执行 `afterPropertiesSet()`
        
    - 如果配置了 `init-method` → 调用指定方法
        
- **作用**：
    
    - 一般用来做一些 **资源准备工作**，比如建立数据库连接、开启定时任务、加载缓存数据等。
        
- **比喻**：这一步就是“启动前的自检和准备”。
    

---

### 4. **BeanPostProcessor 后置处理**

- **方法**：`postProcessAfterInitialization(Object bean, String beanName)`
    
- **什么时候调用**：在 Bean 完成初始化之后。
    
- **作用**：
    
    - 可以对 Bean 再次加工，最常见的是 **AOP（切面代理）**。
        
    - Spring 在这里会给需要增强的 Bean 包一层代理对象（比如事务增强、日志增强）。
        
- **结果**：最后交给你使用的 Bean，可能是一个代理类而不是原始对象。
    

---

✅ **整体理解**  
这四步就像是：

1. **Aware 回调** → 给你一张“地图”，告诉你自己在哪，周围有什么。
    
2. **前置处理** → 在初始化前帮你“化妆、调整”。
    
3. **初始化** → 正式“开机”，做启动必备的准备。
    
4. **后置处理** → 加装“外挂/插件”，比如 AOP 增强。
    
# Spring 作用域

## 常见的 Spring Bean 作用域

1. **singleton（单例，默认值）**
    - 整个 Spring 容器里只存在该 Bean 的 **一个实例**。
    - 每次 `getBean()` 返回的都是同一个对象。
    - 生命周期：
        - 容器启动时创建（默认行为）。
        - 容器关闭时销毁。
            
2. **prototype（原型）**
    - 每次 `getBean()` 或 `@Autowired` 注入，都会返回一个 **新的 Bean 实例**
    - 生命周期：
        - 创建：每次获取时才创建。
        - 销毁：Spring **不负责**管理销毁（需要你自己管理）。
            
3. **request**（仅 Web 环境）
    - 每次 HTTP 请求都会创建一个新的 Bean。
    - 同一个请求内是同一个实例，不同请求是不同实例。
    
4. **session**（仅 Web 环境）
    - 每个 HTTP Session 创建一个新的 Bean。
    - 同一个 Session 内共享，不同 Session 不同。
        
5. **application**（仅 Web 环境）
    - 整个 `ServletContext` 生命周期内只有一个 Bean 实例。
        
6. **websocket**（仅 WebSocket 环境）
    - 每个 WebSocket 会话对应一个 Bean 实例。
        

---

## 使用方式

在 Bean 上加上 `@Scope` 注解即可：

```java
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")  // 原型作用域
public class PrototypeBean {
    public PrototypeBean() {
        System.out.println("PrototypeBean 实例化: " + this);
    }
}
```


## 1. **singleton（单例，默认）**

- **特点**：整个容器中只有一个 Bean 实例。
    
- **适用场景**：
    
    - Bean **无状态**或者共享状态，不依赖特定用户或请求。
        
    - Bean 初始化开销大，但可重复使用。
        
- **示例**：
    
    `@Component public class ConfigService {     // 存储系统配置     private Map<String, String> configs = new HashMap<>();     public String getConfig(String key) { return configs.get(key); }     public void setConfig(String key, String value) { configs.put(key, value); } }`
    
    - **说明**：配置类通常整个应用都共享，所以用单例。
        

---

## 2. **prototype（原型）**

- **特点**：每次获取都会生成新的实例，Spring 不管理销毁。
    
- **适用场景**：
    
    - Bean **有状态**，每个用户或操作需要独立实例。
        
    - Bean 生命周期短或者属于临时对象。
        
- **示例**：
    
    `@Component @Scope("prototype") public class ShoppingCart {     private List<String> items = new ArrayList<>();     public void addItem(String item) { items.add(item); }     public List<String> getItems() { return items; } }`
    
    - **说明**：每个用户都需要一个独立购物车，不能共享。
        

---

## 3. **request（请求）** — Web 环境

- **特点**：每个 HTTP 请求会创建一个新的 Bean 实例。
    
- **适用场景**：
    
    - **用户请求级别的数据**，例如请求参数封装、临时计算结果。
        
- **示例**：
    
    `@Component @Scope("request") public class RequestLogger {     private long requestStartTime = System.currentTimeMillis();     public long getStartTime() { return requestStartTime; } }`
    
    - **说明**：每次请求都有独立日志，不会互相覆盖。
        

---

## 4. **session（会话）** — Web 环境

- **特点**：每个 HTTP Session 会话创建一个 Bean。
    
- **适用场景**：
    
    - 用户登录后保存**会话级状态**。
        
- **示例**：
    
    `@Component @Scope("session") public class UserSession {     private String username;     public void setUsername(String username) { this.username = username; }     public String getUsername() { return username; } }`
    
    - **说明**：每个用户登录后，保存自己的 session 数据。
        

---

## 总结：

|作用域|是否单例|典型使用场景|
|---|---|---|
|singleton|✅|配置类、无状态服务、共享资源|
|prototype|❌|用户对象、临时任务、临时 Bean|
|request|❌|HTTP 请求级临时对象、请求参数处理|
|session|❌|用户会话相关的数据、购物车、登录状态|

---

💡 **经验法则**：

- **默认使用 singleton**，简单、高效、共享。
    
- **有状态或临时 Bean** 使用 prototype。
    
- **Web 环境下的用户请求或会话数据** 使用 request/session。