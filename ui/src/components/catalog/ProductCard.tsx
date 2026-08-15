/**
 * Catalogue product card.
 *
 * Geometry and type are matched to the measured reference (see catalog.css).
 * Conditional fields degrade quietly, per DESIGN.md section 5: a product with
 * one seller shows no seller line, and a missing photo shows a labelled
 * placeholder rather than a broken image.
 */

import React, { useState } from "react";
import { CatalogProduct } from "../../types/catalog";

interface ProductCardProps {
  product: CatalogProduct;
}

/** Rs 1,250 — grouped so the digits stay comparable down a column. */
function formatPrice(amount: number, currency: string): string {
  const grouped = Math.round(amount).toLocaleString("en-US");
  return currency === "USD" ? `$${grouped}` : `Rs ${grouped}`;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Every image in the current scrape is a remote supplier URL, and some of
  // those hosts refuse hotlinks. Falling back keeps the grid even.
  const [imageFailed, setImageFailed] = useState(false);

  const showImage = Boolean(product.image) && !imageFailed;
  const secondary = product.subcategory || product.category;

  return (
    <article className="pcard">
      <div className={`pcard__media${showImage ? "" : " pcard__media--empty"}`}>
        {showImage ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span>No photo</span>
        )}
        {!product.inStock && <span className="pcard__badge">Out of stock</span>}
      </div>

      <div className="pcard__body">
        <div className="pcard__brand">{product.brand}</div>

        <h3 className="pcard__name">{product.name}</h3>

        {secondary && <div className="pcard__meta">{secondary}</div>}

        <div className="pcard__pricerow">
          <span className="pcard__price">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.offerCount > 1 && (
            <span className="pcard__note">{product.offerCount} sellers</span>
          )}
        </div>

        <div className="pcard__spacer" />

        {/*
          The reference's button reads "Add to cart". There is no cart UI and no
          cart endpoint yet, and DESIGN.md section 8 says a control is named for
          what it does — so the geometry and type are identical and the label is
          honest. It becomes "Add to cart" the day the cart exists.
        */}
        <a
          className="pcard__cta"
          href={product.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          View at seller
        </a>
      </div>
    </article>
  );
};

export default ProductCard;
