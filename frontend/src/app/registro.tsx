import Image from "next/image";
import React, { useState } from 'react';
import { UserRegistration } from '../types';

export default function Registro() {

    const [formData, setFormData] = useState<UserRegistration>({
        nombres: '',
        telefono: '',
        experienciaLaboral: '',
        estudios: '',
        cv: null,
    });
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Aquí se puede agregar la lógica para enviar los datos a un servidor
        console.log('Datos enviados:', formData);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setFormData({ ...formData, cv: file });
        } else {
            alert('Por favor, adjunte un archivo PDF.');
        }
    };

  return (
    <div>
            <h1>Registro de Usuarios</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nombres:</label>
                    <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
                </div>
                <div>
                    <label>Teléfono:</label>
                    <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required />
                </div>
                <div>
                    <label>Experiencia Laboral:</label>
                    <textarea name="experienciaLaboral" value={formData.experienciaLaboral} onChange={handleChange} required />
                </div>
                <div>
                    <label>Estudios:</label>
                    <textarea name="estudios" value={formData.estudios} onChange={handleChange} required />
                </div>
                <div>
                    <label>Adjuntar CV (PDF):</label>
                    <input type="file" accept="application/pdf" onChange={handleFileChange} required />
                </div>
                <button type="submit">Registrar</button>
            </form>
        </div>
  );
}