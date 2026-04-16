import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO/SEO';
import styles from './Blog.module.css';

interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  focus_keyword: string;
  cover_image_url: string;
  published_at: string;
  author: string;
  categories: any;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`*, categories:category_id (name)`)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        navigate('/blog', { replace: true });
        return;
      }

      setPost(data as BlogPostDetail);
      setLoading(false);
    }
    fetchPost();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className={styles.blogPage} style={{ paddingTop: '120px' }}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": post.cover_image_url ? [post.cover_image_url] : [],
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "author": [{
        "@type": "Person",
        "name": post.author,
        "url": "https://agencianz.com/sobre"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "NZ Distribuidora",
      "logo": {
        "@type": "ImageObject",
        "url": "https://agencianz.com/assets/logos/logo-nz-ppf.svg"
      }
    },
    "description": post.meta_description
  });

  return (
    <div className={styles.blogPage}>
      <SEO 
        title={post.title}
        description={post.meta_description || post.title}
        keywords={post.focus_keyword || "envelopamento ppf, nzd distribuidora, blog automotivo"}
        canonicalUrl={`/blog/${post.slug}`}
        imageUrl={post.cover_image_url}
        type="article"
        schema={schema}
      />
      
      <main className={`container ${styles.postDetail}`}>
        <motion.article 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <header className={styles.postHeader}>
            {post.categories?.name && (
              <Link to="/blog" className={styles.postCategory}>
                {post.categories.name}
              </Link>
            )}
            <h1 className={styles.postTitle}>{post.title}</h1>
            <div className={styles.postMeta}>
              <span>Escrito por <strong>{post.author}</strong></span>
              <span className={styles.postMetaDot}>•</span>
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </time>
            </div>
          </header>

          {post.cover_image_url && (
            <img 
              src={post.cover_image_url} 
              alt={post.title} 
              className={styles.postCover}
              loading="lazy"
            />
          )}

          <div className={styles.postContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </motion.article>
      </main>
    </div>
  );
}
