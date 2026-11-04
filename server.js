const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// FUNCIÓN AUTOMÁTICA: Crea la tabla de productos si no existe al arrancar
async function crearTablaAutomaticamente() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                precio DECIMAL(10, 2) NOT NULL,
                stock INT NOT NULL
            );
        `);
        console.log("Tabla 'productos' verificada o creada exitosamente en PostgreSQL.");
    } catch (err) {
        console.error("Error al crear la tabla automáticamente:", err);
    }
}

// 1. OBTENER TODOS LOS REGISTROS (READ ALL)
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error("Error en base de datos:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. OBTENER UN SOLO REGISTRO (READ ONE)
app.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el producto' });
    }
});

// 3. AGREGAR UN NUEVO REGISTRO (CREATE)
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, precio, stock } = req.body;
        const result = await pool.query(
            'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *',
            [nombre, precio, stock]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar el producto' });
    }
});

// 4. EDITAR UN REGISTRO (UPDATE)
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, stock } = req.body;
        const result = await pool.query(
            'UPDATE productos SET nombre = $1, precio = $2, stock = $3 WHERE id = $4 RETURNING *',
            [nombre, precio, stock, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// 5. ELIMINAR UN REGISTRO (DELETE)
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
        }
        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// Inicializamos el servidor y ejecutamos la creación de la tabla
app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    await crearTablaAutomaticamente();
});