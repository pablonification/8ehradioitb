import BlogForm from '@/app/components/BlogForm';

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-gray-800 mb-6">Create New Post</h1>
      <BlogForm />
    </div>
  );
}