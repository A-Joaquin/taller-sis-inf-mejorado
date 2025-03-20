import jwt from 'jsonwebtoken';

function generateJWT(payload) {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            'SECRET',
            {
                expiresIn: "1d"
            },
            (err, token) => {
                if(err) reject(new Error(err.message || 'Error generating JWT'));
                else resolve(token);
            }
        )
    });
}
export default generateJWT;