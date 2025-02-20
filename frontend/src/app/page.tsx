"use client";

import React, { useState, useRef } from 'react';
import { UserRegistration } from '../types';

export default function Registro() {
    const [formData, setFormData] = useState<UserRegistration>({
        nombres: '',
        telefono: '',
        experienciaLaboral: '',
        estudios: '',
        cv: null,
    });

    const [errors, setErrors] = useState({
        nombres: '',
        telefono: '',
        experienciaLaboral: '',
        estudios: '',
        cv: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const validate = () => {
        let valid = true;
        let errors = {
            nombres: '',
            telefono: '',
            experienciaLaboral: '',
            estudios: '',
            cv: '',
        };

        if (!formData.nombres) {
            errors.nombres = 'El campo Nombres es obligatorio';
            valid = false;
        }

        if (!formData.telefono) {
            errors.telefono = 'El campo Teléfono es obligatorio';
            valid = false;
        } else if (!/^\d{9}$/.test(formData.telefono)) {
            errors.telefono = 'El campo Teléfono debe contener 9 dígitos';
            valid = false;
        }

        if (!formData.experienciaLaboral) {
            errors.experienciaLaboral = 'El campo Experiencia Laboral es obligatorio';
            valid = false;
        }

        if (!formData.estudios) {
            errors.estudios = 'El campo Estudios es obligatorio';
            valid = false;
        }

        if (!formData.cv) {
            errors.cv = 'El campo CV es obligatorio';
            valid = false;
        }

        setErrors(errors);
        return valid;
    };
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }
        setIsLoading(true);

        const formDataToSend = new FormData();
        formDataToSend.append('nombres', formData.nombres);
        formDataToSend.append('telefono', formData.telefono);
        formDataToSend.append('experienciaLaboral', formData.experienciaLaboral);
        formDataToSend.append('estudios', formData.estudios);
        if (formData.cv) {
            formDataToSend.append('cv', formData.cv);
        }

        try {
            const response = await fetch('http://localhost:5000/registrar', {
                method: 'POST',
                body: formDataToSend,
            });
            const result = await response.json();
            if(result.status === 'OK'){

              setFormData({
                nombres: '',
                telefono: '',
                experienciaLaboral: '',
                estudios: '',
                cv: null,
              });
              setErrors({
                nombres: '',
                telefono: '',
                experienciaLaboral: '',
                estudios: '',
                cv: '',
              });
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              alert('Usuario registrado correctamente');
            }else{
              alert('Error al registrar el usuario');
            }
           
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
        } finally {
            setIsLoading(false);
        }
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
        <div className="flex bg-local">
            <div className="mx-auto max-w-6xl bg-white py-20 px-12 lg:px-24 shadow-xl mb-24">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
                        <div className="loader">Cargando...</div>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
                        <div className="-mx-3 md:flex mb-6">
                            <div className="md:w-1/2 px-3 mb-6 md:mb-0">
                                <label className="uppercase tracking-wide text-black text-xs font-bold mb-2" htmlFor="nombres">
                                    Nombres*
                                </label>
                                <input className="w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3" id="nombres" name="nombres" type="text" value={formData.nombres} onChange={handleChange} required />
                                {errors.nombres && <p className="text-red-500 text-xs italic">{errors.nombres}</p>}
                            </div>
                            <div className="md:w-1/2 px-3">
                                <label className="uppercase tracking-wide text-black text-xs font-bold mb-2" htmlFor="telefono">
                                    Teléfono*
                                </label>
                                <input className="w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3" id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} required />
                                {errors.telefono && <p className="text-red-500 text-xs italic">{errors.telefono}</p>}
                            </div>
                        </div>
                        <div className="-mx-3 md:flex mb-6">
                            <div className="md:w-1/2 px-3 mb-6 md:mb-0">
                                <label className="uppercase tracking-wide text-black text-xs font-bold mb-2" htmlFor="experienciaLaboral">
                                    Experiencia Laboral*
                                </label>
                                <textarea className="w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3" id="experienciaLaboral" name="experienciaLaboral" value={formData.experienciaLaboral} onChange={handleChange} required />
                                {errors.experienciaLaboral && <p className="text-red-500 text-xs italic">{errors.experienciaLaboral}</p>}
                            </div>
                            <div className="md:w-1/2 px-3">
                                <label className="uppercase tracking-wide text-black text-xs font-bold mb-2" htmlFor="estudios">
                                    Estudios*
                                </label>
                                <textarea className="w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3" id="estudios" name="estudios" value={formData.estudios} onChange={handleChange} required />
                                {errors.estudios && <p className="text-red-500 text-xs italic">{errors.estudios}</p>}
                            </div>
                        </div>
                        <div className="-mx-3 md:flex mb-6">
                            <div className="md:w-full px-3">
                                <label className="uppercase tracking-wide text-black text-xs font-bold mb-2" htmlFor="cv">
                                    Adjuntar CV (PDF)*
                                </label>
                                <input className="w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3" id="cv" name="cv" type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} required />
                                {errors.cv && <p className="text-red-500 text-xs italic">{errors.cv}</p>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">
                                Registrar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}