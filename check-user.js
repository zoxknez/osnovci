const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'demo-student-id' },
      include: { student: true }
    });
    
    console.log('User found:', JSON.stringify(user, null, 2));
    
    if (!user) {
      // List all users
      const allUsers = await prisma.user.findMany({ take: 5 });
      console.log('\nFirst 5 users in database:');
      allUsers.forEach(u => console.log(`- ${u.id}: ${u.email}`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
