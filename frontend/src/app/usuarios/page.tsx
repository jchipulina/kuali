"use client";

import React, { useEffect, useState } from 'react';
import './styles.css';

interface Usuario {
    id: number;
    nombres: string;
    telefono: string;
    experiencia_laboral: string;
    estudios: string;
    cv: string;
    creacion: string;
    ranking: number;
}

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await fetch('http://localhost:5003/usuarios');
                const data = await response.json();
                setUsuarios(data);
            } catch (error) {
                console.error('Error al obtener los usuarios:', error);
            }
        };

        fetchUsuarios();
    }, []);

    return (
        <div className="table-container">
            <h1>Lista de Usuarios</h1>
            <table className="table">
                <thead>
                    <tr>
                        <th>Nombres</th>
                        <th>Teléfono</th>
                        <th>Experiencia Laboral</th>
                        <th>Estudios</th>
                        <th>CV</th>
                        <th>Creación</th>
                        <th>Puntos</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(usuario => (
                        <tr key={usuario.id}>
                            <td>{usuario.nombres}</td>
                            <td>{usuario.telefono}</td>
                            <td>{usuario.experiencia_laboral}</td>
                            <td>{usuario.estudios}</td>
                            <td><a href={`http://localhost:5001/uploads/${usuario.cv}`} target="_blank" rel="noopener noreferrer">Ver CV</a></td>
                            <td>{new Date(usuario.creacion).toLocaleString()}</td>
                            <td>{usuario.ranking}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}