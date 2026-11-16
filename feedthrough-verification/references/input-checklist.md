# Feedthrough 输入检查清单

生成 TP 前按以下顺序检查：

1. Source Endpoint：Module、Interface、Clock Domain 是否明确；指定 Signal 时 Signal 是否可以定位。
2. Target Endpoint：Module、Interface、Clock Domain 是否明确；指定 Signal 时 Signal 是否可以定位。
3. Signal Mapping：是否至少存在一条有效 Mapping；Source Signal 与 Target Signal 是否可定位；省略 value relation 时是否确实表示值相等；存在变换时是否给出可判定表达式。
4. Verification Condition：Source 触发条件是否明确。
5. Target Clock Observation Edge：是否明确为非负整数 N。

schema 只检查能否读入 Definition，不以 condition、clock domain 或 N 阻断 Lifecycle 判定。Source module/interface、Target module/interface 与至少一条可定位 mapping 足以建立对象时，缺少其他必要信息仍保留 draft / blocked TP，并按共享 Contract 输出 lifecycle missing-input report。对象尚未成立时不生成 TP，改为输出 scope missing-input report。
