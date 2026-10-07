import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '../pages/BlogIndexPage';

export default function BlogSection({ limit = null, showHeading = true, showViewAllLink = true }) {
  const postsToDisplay = limit ? BLOG_POSTS.slice(0, limit) : BLOG_POSTS;

  return (
    <section className="space-y-8">
      {showHeading && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-forest-900">Agritech Science Blog & Guides</h2>
            <p className="text-typography-secondary text-xs sm:text-sm mt-1">Expert technical articles, financial models, and cultivation guides</p>
          </div>
          {showViewAllLink && (
            <Link to="/blog" className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1.5 hover-lift">
              <span>View All Articles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postsToDisplay.map((post) => (
          <article
            key={post.id}
            className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 flex flex-col justify-between space-y-4 hover:border-forest-700/40 transition-all group hover-lift"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-typography-muted">
                <span className="px-2.5 py-1 rounded-full bg-forest-900/10 border border-forest-900/15 text-forest-800 font-semibold">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-forest-700" /> {post.readTime}
                </span>
              </div>

              <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary group-hover:text-forest-700 transition-colors line-clamp-2">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>

              <p className="text-xs text-typography-secondary leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            </div>

            {/* Interlinked Intent Callout */}
            {post.targetIntent && (
              <div className="p-3 rounded-2xl bg-surface-cream border border-surface-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <Link to={post.targetIntent.guidePath} className="text-typography-primary hover:text-forest-700 font-medium text-[11px]">
                    📖 {post.targetIntent.guideTitle}
                  </Link>
                </div>
                <Link
                  to={post.targetIntent.actionPath}
                  className="w-full py-1.5 px-3 bg-surface-white hover:bg-forest-900/5 text-forest-800 font-bold rounded-xl border border-surface-border flex items-center justify-between text-[11px] transition-all"
                >
                  <span>{post.targetIntent.actionTitle}</span>
                  <ArrowRight className="w-3 h-3 text-forest-700" />
                </Link>
              </div>
            )}

            <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs">
              <span className="text-typography-muted text-[11px] flex items-center gap-1">
                <User className="w-3 h-3 text-forest-700" /> {post.author.split(' ')[0]} {post.author.split(' ')[1]}
              </span>
              <Link
                to={`/blog/${post.slug}`}
                className="text-forest-700 font-bold flex items-center gap-1 hover:gap-2 transition-all"
              >
                <span>Read Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
