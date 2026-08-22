/**
 * One tutorial in the results grid.
 *
 * Deliberately the same shape as `.robot-card` in the chat panel — 10px
 * radius, hairline rule above the figures, mono numerals — so a tutorial and a
 * part read as two views of one catalogue.
 *
 * The thumbnail carries a runtime and nothing else. It used to carry a format
 * pill and a verified badge too, but the badge marked almost every card and
 * distinguished none of them; and the format belongs in the body line, where
 * it is read rather than decoded.
 *
 * Two things changed when the library stopped being hand-written. The title is
 * now an outbound link to the publisher, because we index these tutorials and
 * do not host them — a reader who clicks a title expects to arrive at the
 * lesson, not at a stub of ours. And the byline is shown, because attribution
 * for someone else's writing is not decoration.
 */

import React, { useState } from 'react';
import { Tutorial } from '../../types';
import Price from './Price';
import {
  FORMAT_LABEL,
  formatRuntime,
  kitTotal,
  lengthLabel,
  partCount,
  pricedPartCount,
} from './format';

interface TutorialCardProps {
  tutorial: Tutorial;
}

const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial }) => {
  // The Internet Archive never captured a thumbnail for a handful of these,
  // and a capture can go missing later. Same fallback as ProductCard.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(tutorial.image) && !imageFailed;

  const parts = partCount(tutorial);
  const priced = pricedPartCount(tutorial);
  const length = lengthLabel(tutorial);

  return (
    <li>
      <article className="tut-card">
        <div
          className={`tut-card__media${showImage ? '' : ' tut-card__media--empty'}`}
        >
          {showImage ? (
            <img
              src={tutorial.image}
              alt=""
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span>No photo</span>
          )}
          {tutorial.runtimeSec !== null && (
            <span className="tut-card__runtime">
              {formatRuntime(tutorial.runtimeSec)}
            </span>
          )}
        </div>

        <div className="tut-card__body">
          <h3 className="tut-card__title">
            <a
              href={tutorial.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {tutorial.title}
            </a>
          </h3>

          <p className="tut-card__meta">
            {FORMAT_LABEL[tutorial.format]} · {tutorial.category}
          </p>

          <ul className="tut-card__chips">
            <li className="tut-card__chip tut-card__chip--level">
              {tutorial.level}
            </li>
            {tutorial.platforms.slice(0, 2).map((platform) => (
              <li key={platform} className="tut-card__chip">
                {platform}
              </li>
            ))}
          </ul>

          {length && <p className="tut-card__length">{length}</p>}

          {/* Whose work this is. Kept quiet and last in the body, but present
              on every card — we did not write any of these. */}
          <p className="tut-card__byline">
            {tutorial.author ? `${tutorial.author} · ` : ''}
            {tutorial.sourceName}
          </p>

          {/* The kit line is ours, so it says nothing when we matched nothing
              rather than showing a confident Rs 0. */}
          {priced > 0 ? (
            <div className="tut-card__kit">
              <span className="tut-card__amount">
                <Price amount={kitTotal(tutorial)} />
              </span>
              <span className="tut-card__parts">
                {parts} {parts === 1 ? 'part' : 'parts'}
              </span>
            </div>
          ) : (
            <div className="tut-card__kit">
              <span className="tut-card__parts tut-card__parts--none">
                No parts matched in our catalogue
              </span>
            </div>
          )}
        </div>
      </article>
    </li>
  );
};

export default TutorialCard;
