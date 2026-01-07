const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const spaces = [
    { name: "Escritorio 1", type: "Escritorio Fijo", capacity: 1 },
    { name: "Escritorio 2", type: "Escritorio Fijo", capacity: 1 },
    { name: "Sala 1", type: "Sala de Reuniones", capacity: 1 },
    { name: "Mesa Compartida 1", type: "Mesa compartida", capacity: 6 },
  ];

  for (const s of spaces) {
    await prisma.space.upsert({
      where: { id: 0 }, // Simulado para el ejemplo
      update: {},
      create: s,
    });
  }
}
main();