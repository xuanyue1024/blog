---
title: Java 简单代码验证三门问题
tags:
  - Java
  - 三门问题
author: 竹林听雨
abbrlink: c2b72720
published: 2023-04-16 00:36:32
updated: 2025-10-21 19:10:30
---
 三门问题（Monty Hall problem）是一个有关于博弈论的趣味数学问题。问题名字来自美国的电视游戏节目Let's Make a Deal的主持人蒙提·霍尔（Monty Hall）。
参赛者会看见三扇关闭了的门，其中一扇的后面有一辆汽车，选中后面有车的那扇门就可以赢得该汽车，另外两扇门后面则各藏有一只山羊。当参赛者选定了其中一扇门，但未去开启它的时候，节目主持人会开启剩下两扇门的其中一扇，露出其中一只山羊。此时，参赛者是否应该换另一扇门才能增加获得汽车的概率？这个问题在数学上的解答是：改变选择会使获奖概率增加。

玛丽莲·沃斯·莎凡特（Marilyn vos Savant）是美国《读者文摘》杂志专栏作家，她在1990年6月9日发表了一篇题为“Ask Marilyn”的专栏文章，回答了这个问题。她指出，如果参赛者改变选择，他将有2/3的概率获胜；如果坚持原来的选择，则只有1/3的概率获胜。
这个问题引起了很多争议，许多人认为玛丽莲的答案是错误的。据报道，当时有将近1000名博士和数学家写信给玛丽莲质疑这个答案。

        这段代码是通过模拟三门问题的游戏过程,来验证玛丽莲·沃斯·莎凡特提出的换门后获胜概率增加的结论。代码的主要逻辑如下:1. 输入测试次数,用于多次模拟实验,获得较为准确的概率估计。2. 生成随机的胜利门号(1-3)和玩家初始选择的门号(1-3)。3. 如果初始选择的门号与胜利门号不匹配,则换门必胜。此时,增加换门获胜的次数。否则,增加不换门失败的次数。4. 重复步骤2-3,进行多次模拟实验,获得换门获胜的概率。5. 同样进行多次模拟实验,当玩家选择的初始门号匹配胜利门号时,不换门获胜。否则,不换门失败。获得不换门获胜的概率。6. 输出换门与不换门获胜的概率,可以看出换门的概率是2/3,不换门的概率是1/3,验证了玛丽莲的结论。所以,这段代码通过对三门问题的多次模拟实验,比较换门与不换门的最终获胜次数与概率,证明了换门可以显著增加胜算,概率提高到2/3。这是一个很好的代码示例,不仅展示了如何通过模拟实验来验证一个概率问题,也体现了如何清晰地组织代码逻辑,添加注释等,具有一定的学习价值。对概率、统计以及模拟实验感兴趣的读者可以参考这段代码,理解三门问题这一有趣的概率论命题。

```java
package MontyHallProblem;
import java.util.Random;
import java.util.Scanner;
 
public class MontyHallProblem {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("请输入测试次数：");
        //输入测试次数
        double testTimes = sc.nextInt();
        System.out.println("开始计算\n");
        Random r = new Random();
        //换门输赢测试
        //初始化赢与输的次数
        int Win_ChangeDoor = 0, Lost_InitialDoor = 0;
        //for循环，实现多次的数据测试
        for (int i = 0; i < testTimes; i++) {
            //随机生成赢的门号与猜测的门号(1-3)
            int winNumber = r.nextInt(3) + 1;
            int selectedNumbers = r.nextInt(3) + 1;
            //当赢的值与猜测的值不一样时，换门必定赢，因为换门时排除了一个错误答案,自己猜的又是错的
            if (winNumber != selectedNumbers) {
                //增加赢的次数
                Win_ChangeDoor++;
            } else Lost_InitialDoor++;//增加输的次数
        }
        System.out.println("换门赢概率\t " + Double.parseDouble(String.format("%.2f", (Win_ChangeDoor / testTimes) * 100)) + "%\t 赢了" + Win_ChangeDoor + "次   输了" + Lost_InitialDoor + "次\n");
 
 
        //不换门输赢测试
        //初始化赢与输的次数
        Win_ChangeDoor = 0;
        Lost_InitialDoor = 0;
        //for循环，实现多次的数据测试
        for (int i2 = 0; i2 < testTimes; i2++) {
            //随机生成赢的门号与猜测的门号(1-3)
            int winNumber = r.nextInt(3) + 1;
            int selectedNumbers = r.nextInt(3) + 1;
            //不换门时很简单，猜对就是赢，猜错就是输
            if (winNumber == selectedNumbers) {
                //增加赢的次数
                Win_ChangeDoor++;
            } else Lost_InitialDoor++;//增加输的次数
        }
        //输出不换门与换门的最终结果
        System.out.println("不换门赢概率\t " + Double.parseDouble(String.format("%.2f", (Win_ChangeDoor / testTimes) * 100)) + "%\t 赢了" + Win_ChangeDoor + "次   输了" + Lost_InitialDoor + "次");
    }
}
```

