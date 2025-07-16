'use client';

import { useState } from "react";
import ButtonPrimary from "@/app/components/ButtonPrimary";

function FormInput({ label, type = "text", placeholder, value, onChange, name }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
        </div>
    );
}

export default function LinksDashboardPage() {
    const [formData, setFormData] = useState({
        destination: '',
        title: '',
        slug: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // TODO: Handle form submission
        console.log(formData);
    };
    
    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-heading font-bold mb-6 text-gray-800">Create a short link</h1>
            <div className="bg-white p-8 rounded-2xl shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormInput
                        label="Destination URL"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        placeholder="https://8ehradioitb.com/example"
                    />
                    <FormInput
                        label="Title (optional)"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="website 8EH"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customization</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value="8eh.link"
                                readOnly
                                className="w-1/3 px-4 py-2 bg-gray-200 border border-gray-300 rounded-md text-gray-500"
                            />
                            <span className="text-gray-500">/</span>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="custom-back-half"
                                className="flex-1 px-4 py-2 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />
                        </div>
                    </div>
                     <FormInput
                        label="Password (optional)"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="**********"
                    />
                    <div className="flex justify-end items-center space-x-4 pt-4">
                        <button type="button" className="text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                        <ButtonPrimary type="submit">Create Link</ButtonPrimary>
                    </div>
                </form>
            </div>
        </div>
    );
} 