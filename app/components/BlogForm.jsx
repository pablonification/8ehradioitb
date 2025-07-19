
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then(res => res.json());

function generateSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
}

const CATEGORY_OPTIONS = ["News", "Event", "Achievement", "Artikel", "Custom"];

export default function BlogForm({ post: initialPost, isEditing = false }) {
    const [post, setPost] = useState({
        title: '', slug: '', content: '', category: '',
        description: '', readTime: '', tags: '', mainImage: '',
    });
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [customCategory, setCustomCategory] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
    const router = useRouter();
    const contentRef = useRef(null);
    const authorDropdownRef = useRef(null);
    const { data: session } = useSession();
    const { data: users, error: usersError } = useSWR('/api/users', fetcher);

    useEffect(() => {
        if (session && !isEditing) setSelectedAuthors([session.user.id]);
        if (isEditing && initialPost) {
            const { tags, readTime, category, authors } = initialPost;
            setPost({
                ...initialPost,
                tags: Array.isArray(tags) ? tags.join(', ') : '',
                readTime: readTime ? parseInt(readTime, 10) || '' : '',
            });
            if (authors) setSelectedAuthors(authors.map(a => a.user.id));
            if (category && !CATEGORY_OPTIONS.includes(category)) {
                setIsCustomCategory(true);
                setCustomCategory(category);
            }
        }
    }, [initialPost, isEditing, session]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target)) {
                setIsAuthorDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [authorDropdownRef]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "category") {
            const custom = value === "Custom";
            setIsCustomCategory(custom);
            setPost(prev => ({ ...prev, category: custom ? '' : value }));
            if (!custom) setCustomCategory('');
        } else {
            setPost(prev => ({ ...prev, [name]: value }));
            if (name === 'title') setPost(prev => ({ ...prev, slug: generateSlug(value) }));
        }
    };

    const handleAuthorChange = (userId) => {
        setSelectedAuthors(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleContentImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.secure_url) {
                const markdownImage = `\n![${file.name}](${data.secure_url})\n`;
                const textarea = contentRef.current;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent = post.content.substring(0, start) + markdownImage + post.content.substring(end);
                setPost(prev => ({ ...prev, content: newContent }));
            } else {
                throw new Error('Image upload failed to return a secure URL.');
            }
        } catch (err) {
            alert('Image upload failed: ' + err.message);
        }
        // Clear the file input
        e.target.value = null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedAuthors.length === 0) {
            alert('Please select at least one author.');
            return;
        }

        setIsSubmitting(true);

        let imageUrl = post.mainImage;
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                if (data.secure_url) {
                    imageUrl = data.secure_url;
                } else {
                    throw new Error('Image upload failed');
                }
            } catch (err) {
                alert('Image upload failed: ' + err.message);
                setIsSubmitting(false);
                return;
            }
        }

        const postCategory = isCustomCategory ? customCategory : post.category;
        if (!postCategory) {
            alert('Please select or enter a category.');
            setIsSubmitting(false);
            return;
        }

        const postData = {
            ...post,
            mainImage: imageUrl,
            tags: post.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            readTime: post.readTime ? `${post.readTime} min read` : null,
            category: postCategory,
            authorIds: selectedAuthors,
        };

        const url = isEditing ? `/api/blog/${initialPost.slug}` : '/api/blog';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save post');
            }

            router.push('/dashboard/blog');
            router.refresh();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 sm:p-8 shadow-md rounded-lg border border-gray-200">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-800 font-body mb-2">Title</label>
                    <input 
                        type="text" 
                        name="title" 
                        id="title" 
                        value={post.title} 
                        onChange={handleChange} 
                        className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        required 
                    />
                </div>
                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-800 font-body mb-2">Slug</label>
                    <input 
                        type="text" 
                        name="slug" 
                        id="slug" 
                        value={post.slug} 
                        onChange={handleChange} 
                        className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-500 bg-gray-100 cursor-not-allowed" 
                        readOnly 
                    />
                </div>
            </div>

            {/* Content */}
            <div>
                <div className="flex justify-between items-center">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-800 font-body mb-2">Content (Markdown)</label>
                    <label className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer font-body transition-colors">
                        Add Image
                        <input type="file" accept="image/*" onChange={handleContentImageUpload} className="hidden" />
                    </label>
                </div>
                <textarea 
                    name="content" 
                    id="content" 
                    ref={contentRef} 
                    rows="15" 
                    value={post.content} 
                    onChange={handleChange} 
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono" 
                    required
                ></textarea>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-800 font-body mb-2">Description</label>
                <input
                    type="text"
                    name="description"
                    id="description"
                    value={post.description}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Authors */}
            <div className="relative" ref={authorDropdownRef}>
                <label className="block text-sm font-medium text-gray-800 font-body mb-2">Authors</label>
                <button
                    type="button"
                    onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                    {selectedAuthors.length > 0
                        ? `${selectedAuthors.length} author(s) selected`
                        : "Select authors..."}
                </button>
                {isAuthorDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {usersError && <p className="p-4 text-red-700 font-body">Failed to load users.</p>}
                        {!users && !usersError && <p className="p-4 font-body text-gray-700">Loading users...</p>}
                        {users?.map(user => (
                            <div key={user.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                <input
                                    type="checkbox"
                                    id={`author-${user.id}`}
                                    checked={selectedAuthors.includes(user.id)}
                                    onChange={() => handleAuthorChange(user.id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`author-${user.id}`} className="ml-3 block text-sm font-body text-gray-900 flex-1 cursor-pointer">
                                    {user.name} <span className="text-gray-500">({user.email})</span>
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Category, Custom Category, Read Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-800 font-body mb-2">Category</label>
                    <select
                        name="category"
                        id="category"
                        value={isCustomCategory ? "Custom" : post.category}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                        <option value="">Select a category</option>
                        {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                {isCustomCategory && (
                    <div>
                        <label htmlFor="customCategory" className="block text-sm font-medium text-gray-800 font-body mb-2">Custom Category</label>
                        <input
                            type="text"
                            name="customCategory"
                            id="customCategory"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter custom category"
                        />
                    </div>
                )}
                <div>
                    <label htmlFor="readTime" className="block text-sm font-medium text-gray-800 font-body mb-2">Read Time (minutes)</label>
                    <input
                        type="number"
                        name="readTime"
                        id="readTime"
                        value={post.readTime}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 5"
                    />
                </div>
            </div>

            {/* Tags */}
            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-800 font-body mb-2">Tags (comma-separated)</label>
                <input
                    type="text"
                    name="tags"
                    id="tags"
                    value={post.tags}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 p-3 rounded-md font-body text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Cover Image */}
            <div>
                <label htmlFor="mainImage" className="block text-sm font-medium text-gray-800 font-body mb-2">Cover Image</label>
                <input
                    type="file"
                    name="mainImage"
                    id="mainImage"
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm font-body text-gray-900 border border-gray-300 p-3 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {post.mainImage && !imageFile && (
                    <img 
                        src={post.mainImage} 
                        alt="Current cover" 
                        className="mt-4 h-32 object-cover rounded-md border border-gray-200 shadow-sm" 
                    />
                )}
            </div>

            {/* Submit Button */}
            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-body font-semibold transition-colors duration-200"
                >
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
                </button>
            </div>
        </form>
    );
} 