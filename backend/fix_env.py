content = """MONGO_URI=mongodb://localhost:27017
DB_NAME=coldchain
BLOCKCHAIN_RPC=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
CHAIN_ID=31337
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
UPLOAD_DIR=./uploads
QR_DIR=./qrcodes
OPENWEATHER_API_KEY=your_api_key_here
"""

with open('.env', 'wb') as f:
    f.write(content.encode('utf-8'))
