# Nó blockchain local (Hardhat) + deploy dos contratos
FROM node:20-bullseye-slim

WORKDIR /app

# dependências de sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 git curl \
    && rm -rf /var/lib/apt/lists/*

# instala dependências do projeto de contratos
COPY package.json package-lock.json* ./
# install all dependencies (including hardhat-toolbox peer deps)
RUN npm install

# código dos contratos e scripts
COPY contracts ./contracts
COPY scripts ./scripts
COPY hardhat.config.js ./

EXPOSE 8545

# sobe o nó Hardhat acessível na rede do compose (0.0.0.0)
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
