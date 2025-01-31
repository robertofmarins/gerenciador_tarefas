const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Configuração do dotenv e Prisma
dotenv.config();
const prisma = new PrismaClient();

// Inicializando o Express
const app = express();
app.use(cors());
app.use(express.json()); // Para analisar JSON no corpo da requisição

// Verifica se a chave secreta JWT está definida
if (!process.env.JWT_SECRET) {
    throw new Error('A chave secreta JWT não está definida.');
}


// Rota para cadastro de usuário
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Verificando se o email já está cadastrado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    // Criptografando a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criando o novo usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Gerando o token JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// Rota para login de usuário
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscando o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    // Verificando a senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Senha incorreta.' });
    }

    // Gerando o token JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token });
  } catch (error) { // Use "error" em vez de "err" para evitar confusão
    console.error('Erro completo:', error); // Exibe o erro completo no terminal
    res.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
});

// Iniciando o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
