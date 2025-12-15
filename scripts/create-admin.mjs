import bcrypt from 'bcryptjs';

const password = '@Data210308!';
const hash = await bcrypt.hash(password, 12);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('');
console.log('SQL para atualizar o usuário:');
console.log(`UPDATE users SET username = 'admdataroit', passwordHash = '${hash}', loginMethod = 'local', isActive = 1 WHERE email = 'contato@dataro-it.com.br' OR openId = 'admdataroit';`);
