const bcrypt = require('bcrypt');

bcrypt.hash('1234', 10, (err, hash) => {
    if (err) {
        console.error('Error generando hash:', err);
    } else {
        console.log('Hash generado:', hash);
    }
});