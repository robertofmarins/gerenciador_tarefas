const express = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Criar uma nova tarefa (rota protegida)
router.post("/", authMiddleware, async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: "O título da tarefa é obrigatório." });
    }

    try {
        const newTask = await prisma.task.create({
            data: {
                title,
                userId: req.user.userId, // Pegando o ID do usuário autenticado
            },
        });

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar tarefa." });
    }
});

// Rota para listar todas as tarefas do usuário (rota protegida)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                userId: req.user.userId, // Apenas tarefas do usuário autenticado
            },
        });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar tarefas." });
    }
});

// Rota para atualizar o status da tarefa (rota protegida)
router.put("/:id", authMiddleware, async (req, res) => {
    const taskId = parseInt(req.params.id); // ID da tarefa

    try {
        const task = await prisma.task.updateMany({
            where: {
                id: taskId,
                userId: req.user.userId, // Verificando se a tarefa pertence ao usuário
            },
            data: {
                completed: true, // Marcar como concluída
            },
        });

        if (task.count === 0) {
            return res.status(404).json({ error: "Tarefa não encontrada ou não autorizada." });
        }

        res.status(200).json({ message: "Tarefa marcada como concluída." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar tarefa." });
    }
});

// Rota para excluir uma tarefa (rota protegida)
router.delete("/:id", authMiddleware, async (req, res) => {
    const taskId = parseInt(req.params.id); // ID da tarefa

    try {
        const task = await prisma.task.deleteMany({
            where: {
                id: taskId,
                userId: req.user.userId, // Verificando se a tarefa pertence ao usuário
            },
        });

        if (task.count === 0) {
            return res.status(404).json({ error: "Tarefa não encontrada ou não autorizada." });
        }

        res.status(200).json({ message: "Tarefa excluída com sucesso." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir tarefa." });
    }
});




module.exports = router;
