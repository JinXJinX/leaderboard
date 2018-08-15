This document explains why I choose to use the design patterns that I did.

#### 0. Fail early and fail loud

All functions check the condition required for execution as early as possible in the function body and throws an exception if the condition is not met. This is a good practice to reduce unnecessary code execution in the event that an exception will be thrown.

#### 1. emergency stop

Allow contract functionality to be stopped to handler emergency event.

#### 2. restricting access

Use modifier ```OnlyManager``` to special addresses are permitted to execute manager functions.

#### 3. mortal

Including the ability to destroy the contract and remove it from the blockchain.
