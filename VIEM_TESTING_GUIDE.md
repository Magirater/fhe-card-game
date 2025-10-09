# Viem Testing Guide для MockFHEVM Game

Этот гайд объясняет, как использовать viem с Hardhat 3 для тестирования контракта MockFHEVM Game.

## 🔧 Исправления

### 1. Исправлена ошибка в SimpleFHEArrayTest.sol
**Проблема**: `FHE.rem` не существует в библиотеке FHE
**Решение**: Заменено на `FHE.mod` для получения остатка от деления

```solidity
// Было:
euint16 remainder = FHE.rem(sum, two);

// Стало:
euint16 remainder = FHE.mod(sum, two);
```

### 2. Обновлена конфигурация Hardhat для viem
```typescript
import type { HardhatUserConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";

const config: HardhatUserConfig = {
  plugins: [hardhatViem],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
  },
};
```

### 3. Добавлены необходимые зависимости
```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-viem": "^3.0.0",
    "@nomicfoundation/hardhat-viem-assertions": "^1.0.0",
    "mocha": "^10.0.0"
  }
}
```

## 🚀 Запуск тестов

### Установка зависимостей
```bash
npm install
```

### Компиляция контрактов
```bash
npm run compile
```

### Запуск тестов
```bash
# Все тесты
npm run test

# Только Solidity тесты
npm run test:solidity

# Только TypeScript тесты с viem
npm run test:nodejs

# Конкретный viem тест
npm run test:viem

# E2E тесты
npm run test:e2e

# Все тесты в папке test/
npm run test:all
```

## 📁 Структура тестов

```
test/
├── MockFHEVMGame.viem.test.ts      # Основные viem тесты
├── MockFHEVMGame.e2e.test.ts       # E2E тесты с viem assertions
└── utils/
    └── GameTestHelpers.ts          # Утилиты для тестирования

contracts/
├── MockFHEVMGame.sol               # Основной контракт игры
├── MockFHEVMGame.t.sol             # Solidity unit тесты
└── SimpleFHEArrayTest.sol          # FHE тестовый контракт (исправлен)
```

## 🧪 Особенности viem тестирования

### 1. Подключение к сети
```typescript
import { network } from "hardhat";

const connection = await network.connect();
const viem = connection.viem;
```

### 2. Получение клиентов
```typescript
const publicClient = await viem.getPublicClient();
const walletClients = await viem.getWalletClients();
```

### 3. Деплой контракта
```typescript
const gameContract = await viem.deployContract("MockFHEVMGame");
```

### 4. Использование viem assertions
```typescript
// Тестирование событий
await viem.assertions.emitWithArgs(
  gameContract.write.createGame(),
  gameContract,
  "GameCreated",
  [owner.account.address]
);

// Тестирование ревертов
await viem.assertions.revertWithReason(
  gameContract.write.playCard([gameId, 99n]),
  "You don't have this card"
);
```

### 5. Взаимодействие с контрактом
```typescript
// Чтение данных
const nextGameId = await gameContract.read.nextGameId();
const playerHand = await gameContract.read.getPlayerHand([gameId]);

// Запись данных
const hash = await gameContract.write.createGame();
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

## 🎯 Ключевые преимущества viem

1. **Типобезопасность**: Полная поддержка TypeScript
2. **Современный API**: Более простой и интуитивный
3. **Производительность**: Быстрее чем ethers.js
4. **Viem Assertions**: Мощные утилиты для тестирования
5. **Hardhat 3 интеграция**: Нативная поддержка

## 🔍 Отладка

### Частые ошибки
1. **HHE1200**: Неправильная конфигурация тестового раннера
2. **TypeError: Member "rem" not found**: Использование несуществующих функций FHE
3. **Import errors**: Отсутствующие зависимости

### Решения
1. Убедитесь, что `@nomicfoundation/hardhat-viem` установлен
2. Проверьте правильность импортов FHE функций
3. Используйте `npm run compile` перед тестами

## 📚 Дополнительные ресурсы

- [Hardhat 3 Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh/)
- [FHE Solidity Library](https://docs.zama.ai/fhevm)
- [Hardhat Viem Plugin](https://hardhat.org/docs/learn-more/using-viem)
