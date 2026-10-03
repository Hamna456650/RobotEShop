'use client';

/**
 * The dashboard overview. Every figure and row comes from `useDashboard()`:
 * the mock server for the catalogue and tutorials, Supabase for reviews.
 * Nothing here is typed in, so the page cannot drift from the data behind it.
 * Each section loads and fails on its own, and says so in its own words.
 */

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import StatsGrid from '@/components/dashboard/StatsGrid';
import QuickLinks from '@/components/dashboard/QuickLinks';
import { config } from '@/config/config';
import { useAuth } from '@/context/AuthContext';
import { Source, useDashboard } from '@/hooks/useDashboard';
import { groupDigits, priceUnit, timeAgo } from '@/components/community/format';
import { pricedPartCount } from '@/components/tutorials/format';

const card = 'bg-white rounded-xl border border-gray-100 shadow-sm';

function SectionHead({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <Link
        href={href}
        className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-sm"
      >
        {label} <ArrowRight size={16} />
      </Link>
    </div>
  );
}

/** Loading bars, or the source's own error sentence; null once data is in. */
function waiting<T>(source: Source<T>, rows = 3) {
  if (source.error) return <p className="text-sm text-gray-500">{source.error}</p>;
  if (source.isLoading || source.data === null) {
    return (
      <div className="space-y-3 animate-pulse" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }
  return null;
}

function Photo({ src, className }: { src: string; className: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`bg-gray-100 overflow-hidden flex items-center justify-center ${className}`}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="text-xs text-gray-400">No photo</span>
      )}
    </div>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 shrink-0" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-2.5 h-1.5 rounded-sm ${n <= value ? 'bg-green-600' : 'bg-gray-200'}`} />
      ))}
    </span>
  );
}

export default function DashboardPage() {
  const { user, displayName, profile } = useAuth();
  const dash = useDashboard(user?.id ?? null);

  const products = dash.health.data?.robots ?? null;
  const catalogError = dash.health.error ?? dash.categories.error;
  const activity = dash.activity;
  const latest = activity?.latest ?? null;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{displayName ? `, ${displayName}` : ''} <span className="inline-block">👋</span>
        </h1>
        <p className="text-gray-500 mt-2">
          {products !== null
            ? `${groupDigits(products)} products across ${config.ui.stores.length} stores. Explore, compare, and learn about robots.`
            : catalogError ?? 'Explore, compare, and learn about robots.'}
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        products={products}
        categories={dash.categories.data ? dash.categories.data.length : null}
        stores={config.ui.stores.length}
        tutorials={dash.tutorials.data ? dash.tutorials.data.length : null}
      />

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <QuickLinks />
      </div>

      {/* Your activity */}
      <div>
        <SectionHead title="Your Activity" href="/community" label="Community" />
        {dash.reviews.error ? (
          <div className={`${card} p-5`}>
            <p className="text-sm text-gray-500">{dash.reviews.error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${card} p-5`}>
              {profile?.createdAt && (
                <p className="text-sm text-gray-500 mb-4">
                  Member since{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </p>
              )}
              <dl className="grid grid-cols-3 gap-4">
                {[
                  ['Reviews', activity?.reviews],
                  ['Replies', activity?.replies],
                  ['Helpful votes', activity?.helpful],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{value ?? '–'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {latest ? (
              <Link href="/community" className={`${card} p-5 lg:col-span-2 hover:shadow-md transition-shadow`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Your latest review
                </p>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 truncate">{latest.product.name}</h3>
                  <Rating value={latest.rating} />
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {latest.title || latest.body.split('\n')[0]}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {latest.helpful} helpful · {activity?.latestReplies ?? 0}{' '}
                  {activity?.latestReplies === 1 ? 'reply' : 'replies'} · {timeAgo(latest.createdAt)}
                </p>
              </Link>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center lg:col-span-2">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  {activity ? 'Your first review goes here.' : 'Loading your activity…'}
                </h3>
                {activity && (
                  <p className="text-gray-500 text-sm">
                    Say what board you tested it on.{' '}
                    <Link href="/community" className="text-green-600 hover:text-green-700 font-medium">
                      Write a review
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products several stores carry: where price comparison has something to compare */}
      <div>
        <SectionHead title="Compared Across Stores" href="/catalog?sort=sellers-desc" label="View All" />
        {waiting(dash.compared, 1) ??
          ((dash.compared.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">
              No product is listed on more than one store yet. Comparisons appear once a second store stocks the same part.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(dash.compared.data ?? []).map((product) => (
                <Link
                  key={product.id}
                  href={`/catalog?q=${encodeURIComponent(product.name)}`}
                  className={`${card} hover:shadow-md transition-shadow overflow-hidden`}
                >
                  <Photo src={product.image} className="aspect-video" />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {product.offerCount} stores · {product.category}
                    </p>
                    <p className="text-green-600 font-bold mt-2">
                      <span className="text-xs font-medium text-gray-500 mr-1">from</span>
                      {priceUnit(product.currency)} {groupDigits(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ))}
      </div>

      {/* Newest tutorials and latest community reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHead title="Newest Tutorials" href="/tutorials" label="All Tutorials" />
          <div className={`${card} p-4`}>
            {waiting(dash.tutorials, 2) ??
              ((dash.tutorials.data ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">
                  No tutorials indexed yet. Run <code>run_tutorials.py</code> to build the library.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {(dash.tutorials.data ?? []).slice(0, 3).map((tutorial) => {
                    const priced = pricedPartCount(tutorial);
                    return (
                      <li key={tutorial.id}>
                        <a
                          href={tutorial.sourceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center gap-4 py-3 group"
                        >
                          <Photo src={tutorial.image} className="w-24 h-16 rounded-lg shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-green-600">
                              {tutorial.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {tutorial.author ? `${tutorial.author} · ` : ''}
                              {tutorial.level}
                              {priced > 0 && ` · ${priced} priced ${priced === 1 ? 'part' : 'parts'}`}
                            </p>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ))}
          </div>
        </div>

        <div>
          <SectionHead title="Latest Reviews" href="/community" label="Community" />
          <div className={`${card} p-4`}>
            {waiting(dash.reviews, 3) ??
              ((dash.reviews.data ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nothing reviewed yet. The first review is the one that makes the page worth reading.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {(dash.reviews.data ?? []).slice(0, 3).map((review) => (
                    <li key={review.id}>
                      <Link href="/community" className="block py-3 group">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-gray-900 text-sm truncate group-hover:text-green-600">
                            {review.product.name}
                          </p>
                          <Rating value={review.rating} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {review.author} · {timeAgo(review.createdAt)} · {review.helpful} helpful
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
