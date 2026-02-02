---
trigger: always_on
---

Use Yoda conditions:
When comparing variables to values, always write the value on the left and the var on the right, to prevent accidential variable override when missing a equals sign.
For examble:
```typescript
var1: string;

if('value123' === var1)
```