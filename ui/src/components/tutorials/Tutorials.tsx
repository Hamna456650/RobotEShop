/**
 * Tutorials — the editorial layer the source sites do not carry.
 *
 * Structure, and why:
 *
 *   Hero          The claim, then coverage as one mono line. No stat tiles.
 *   Featured      A build with its bill of materials priced from the
 *                 catalogue. This is the page's argument in one card.
 *   Rail + grid   Faceted browse, because chatting is a bad way to find out
 *                 what exists.
 *
 * Filtering, search and sorting all run client-side against src/data/tutorials.
 * Nothing here talks to the server yet.
 */

import React, { useMemo, useState } from 'react';

import { Tutorial } from '../../types';
import { tutorials as allTutorials, featuredId } from '../../data/tutorials';
import FeaturedTutorial from './FeaturedTutorial';
import FilterRail, { FilterGroup } from './FilterRail';
import TutorialCard from './TutorialCard';
import { FORMAT_LABEL, kitTotal } from './format';
import '../../tutorials.css';

type SortKey = 'featured' | 'steps' | 'price';

/** How each filter group reads its values off a tutorial. */
const FACETS: {
  key: string;
  legend: string;
  values: (tutorial: Tutorial) => string[];
  /** Fixed display order where the values are a scale rather than a set. */
  order?: string[];
}[] = [
  {
    key: 'format',
    legend: 'Format',
    values: (t) => [t.format],
    order: ['video', 'guide', 'wiring'],
  },
  {
    key: 'level',
    legend: 'Level',
    values: (t) => [t.level],
    order: ['Beginner', 'Intermediate', 'Advanced'],
  },
  { key: 'platform', legend: 'Platform', values: (t) => t.platforms },
  { key: 'category', legend: 'Category', values: (t) => [t.category] },
];

const EMPTY_SELECTION: Record<string, string[]> = {};

/** Free text runs over everything a person might half-remember. */
const searchable = (tutorial: Tutorial): string =>
  [
    tutorial.title,
    tutorial.summary,
    tutorial.category,
    tutorial.level,
    ...tutorial.platforms,
    ...tutorial.parts.map((part) => part.name),
  ]
    .join(' ')
    .toLowerCase();

const Tutorials: React.FC = () => {
  const [selected, setSelected] =
    useState<Record<string, string[]>>(EMPTY_SELECTION);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');

  const trimmedQuery = query.trim().toLowerCase();
  const hasFilters = Object.values(selected).some((v) => v.length > 0);
  const isBrowsing = !hasFilters && trimmedQuery === '';

  const toggle = (groupKey: string, value: string) => {
    setSelected((current) => {
      const group = current[groupKey] || [];
      const next = group.includes(value)
        ? group.filter((v) => v !== value)
        : [...group, value];
      return { ...current, [groupKey]: next };
    });
  };

  const clear = () => {
    setSelected(EMPTY_SELECTION);
    setQuery('');
  };

  /** True when the tutorial satisfies every group except `skipKey`. */
  const matches = useMemo(
    () => (tutorial: Tutorial, skipKey?: string) => {
      if (trimmedQuery && !searchable(tutorial).includes(trimmedQuery)) {
        return false;
      }
      return FACETS.every((facet) => {
        if (facet.key === skipKey) return true;
        const chosen = selected[facet.key] || [];
        if (chosen.length === 0) return true;
        return facet
          .values(tutorial)
          .some((value) => chosen.includes(value));
      });
    },
    [selected, trimmedQuery]
  );

  const results = useMemo(() => {
    const found = allTutorials.filter((tutorial) => matches(tutorial));
    if (sort === 'steps') {
      return [...found].sort((a, b) => a.steps - b.steps);
    }
    if (sort === 'price') {
      return [...found].sort((a, b) => kitTotal(a) - kitTotal(b));
    }
    return found;
  }, [matches, sort]);

  /* Counts are computed against everything *except* the group they sit in, so
     ticking a second box inside one group widens the result rather than
     zeroing its own siblings. */
  const groups: FilterGroup[] = useMemo(
    () =>
      FACETS.map((facet) => {
        const pool = allTutorials.filter((t) => matches(t, facet.key));
        const counts = new Map<string, number>();

        allTutorials.forEach((tutorial) =>
          facet.values(tutorial).forEach((value) => {
            if (!counts.has(value)) counts.set(value, 0);
          })
        );
        pool.forEach((tutorial) =>
          facet.values(tutorial).forEach((value) => {
            counts.set(value, (counts.get(value) || 0) + 1);
          })
        );

        const values = facet.order
          ? facet.order.filter((value) => counts.has(value))
          : Array.from(counts.keys()).sort();

        return {
          key: facet.key,
          legend: facet.legend,
          options: values.map((value) => ({
            value,
            label:
              facet.key === 'format'
                ? FORMAT_LABEL[value as keyof typeof FORMAT_LABEL]
                : value,
            count: counts.get(value) || 0,
          })),
        };
      }),
    [matches]
  );

  const featured = allTutorials.find((t) => t.id === featuredId);

  const coverage = useMemo(() => {
    const parts = new Set<string>();
    const platforms = new Set<string>();
    allTutorials.forEach((tutorial) => {
      tutorial.parts.forEach((part) => parts.add(part.name));
      tutorial.platforms.forEach((platform) => platforms.add(platform));
    });
    return {
      guides: allTutorials.length,
      parts: parts.size,
      platforms: platforms.size,
    };
  }, []);

  const shown = isBrowsing
    ? results.filter((tutorial) => tutorial.id !== featuredId)
    : results;

  return (
    <main className="tutorials">
      {/* Two columns rather than a stack: the claim on the left, the way in on
          the right. Keeps the band under 200px so the first tutorial is on
          screen without scrolling. */}
      <div className="tut-hero">
        <div className="tut-shell tut-hero__inner">
          <div>
            <h1 className="tut-hero__title">Learn the part before you buy it</h1>
            <p className="tut-hero__lead">
              Every guide is anchored to hardware you can order here, and lists
              what the build costs before you start it. Written for someone
              whose first Arduino is still in the box.
            </p>
            {/* Coverage as a sentence. It used to be a strip of uppercase
                figures joined by middots, which looks like data and reads like
                decoration. */}
            <p className="tut-hero__lead">
              <b>{coverage.guides}</b> guides so far, covering{' '}
              <b>{coverage.parts}</b> parts across <b>{coverage.platforms}</b>{' '}
              boards.
            </p>
          </div>

          <div className="tut-hero__aside">
            <div className="tut-search">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a part, a board, or a build"
                aria-label="Search tutorials"
              />
            </div>

            <p className="tut-hero__note">
              Sample content. The scraper leaves tutorials empty on purpose —
              the source sites carry none — so this library is written by hand.
            </p>
          </div>
        </div>
      </div>

      <div className="tut-shell">
        <div className="tut-body">
          <FilterRail
            groups={groups}
            selected={selected}
            onToggle={toggle}
            onClear={clear}
            hasFilters={hasFilters || trimmedQuery !== ''}
          />

          <div>
            {isBrowsing && featured && <FeaturedTutorial tutorial={featured} />}

            <div className="tut-toolbar">
              <p className="tut-toolbar__count">
                <b>{shown.length}</b>{' '}
                {isBrowsing
                  ? shown.length === 1
                    ? 'more tutorial'
                    : 'more tutorials'
                  : shown.length === 1
                  ? 'tutorial matches'
                  : 'tutorials match'}
              </p>

              <label className="tut-sort">
                Sort by
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                >
                  <option value="featured">Featured order</option>
                  <option value="steps">Fewest steps</option>
                  <option value="price">Cheapest kit</option>
                </select>
              </label>
            </div>

            {shown.length > 0 ? (
              <ul className="tut-grid">
                {shown.map((tutorial) => (
                  <TutorialCard key={tutorial.id} tutorial={tutorial} />
                ))}
              </ul>
            ) : (
              /* Says what the library actually holds, rather than "no
                 results" — the gap here is editorial coverage, not a
                 mistyped query. */
              <div className="tut-empty">
                <h3>Nothing written for that combination yet</h3>
                <p>
                  The library is {coverage.guides} hand-written guides so far,
                  weighted towards Arduino and ESP32 sensor work. Raspberry Pi
                  and ROS builds are still to come.
                </p>
                <p>
                  Widen the filters, or ask the advisor — it can search the full{' '}
                  catalogue of parts even where no tutorial exists.
                </p>
                <button type="button" className="tut-button" onClick={clear}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Tutorials;
