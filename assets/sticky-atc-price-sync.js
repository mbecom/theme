(() => {
  const rafDebounce = (fn) => {
    let scheduled = false;
    return () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        fn();
      });
    };
  };

  const stripCurrencyCode = (value) => {
    if (!value) return '';
    return value
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s[A-Z]{3}$/, '')
      .trim();
  };

  const extractVisiblePriceText = (container) => {
    if (!container) return '';

    const priceRoot = container.querySelector('.price');
    const isOnSale = priceRoot?.classList.contains('price--on-sale');
    const preferredSelector = isOnSale
      ? '.price__sale .price-item--sale'
      : '.price__regular .price-item--regular';

    const priceEl =
      container.querySelector(preferredSelector) ||
      container.querySelector('.price-item--sale') ||
      container.querySelector('.price-item--regular') ||
      container.querySelector('.price-item');

    return stripCurrencyCode(priceEl?.textContent);
  };

  const extractQuantityBreaksPriceText = (quantityBreaksEl) => {
    if (!quantityBreaksEl) return '';
    const checked = quantityBreaksEl.querySelector('input[name="quantity"]:checked');
    if (!checked) return '';

    const label = checked.nextElementSibling;
    if (!(label instanceof HTMLElement)) return '';

    const priceEl = label.querySelector('.quantity-break__price');
    return stripCurrencyCode(priceEl?.textContent);
  };

  const extractMoonbundleActivePrices = (scope) => {
    if (!scope) return null;
    const active = scope.querySelector('.moonbundle-option-active');
    if (!active) return null;

    const priceEl =
      active.querySelector('.moonbundle-option-single-price') ||
      active.querySelector('.moonbundle-option-new-price') ||
      active.querySelector('[class*="moonbundle-option-"][class*="price"]');
    const priceText = stripCurrencyCode(priceEl?.textContent);
    if (!priceText) return null;

    const compareEl =
      active.querySelector('.moonbundle-option-old-price') ||
      active.querySelector('.moonbundle-option-compare-price');
    const compareText = stripCurrencyCode(compareEl?.textContent);

    return { priceText, compareText };
  };

  const syncSection = (sectionId) => {
    if (!sectionId) return;

    const productInfo =
      document.getElementById(`ProductInfo-${sectionId}`) ||
      document.querySelector(`product-info[data-section="${sectionId}"]`);

    const scope = productInfo || document;
    const mainPrice = scope.querySelector(`#price-${sectionId}`) || document.getElementById(`price-${sectionId}`);
    const quantityBreaks =
      scope.querySelector(`#quantity-breaks-${sectionId}`) ||
      document.getElementById(`quantity-breaks-${sectionId}`);

    const moonbundle = extractMoonbundleActivePrices(scope) || extractMoonbundleActivePrices(document);
    const priceText =
      moonbundle?.priceText ||
      extractQuantityBreaksPriceText(quantityBreaks) ||
      extractVisiblePriceText(mainPrice);
    if (!priceText) return;

    const idValue = `sticky-atc-price-${sectionId}`;
    document.querySelectorAll(`[id="${idValue}"]`).forEach((el) => {
      const nextText = `${priceText} •`;
      if (el.textContent !== nextText) el.textContent = nextText;
    });

    const stickySeparatePrice = document.getElementById(`sticky-atc-separate-price-${sectionId}`);
    if (stickySeparatePrice) {
      const saleEl = stickySeparatePrice.querySelector('.price__sale .price-item--sale');
      const regEl = stickySeparatePrice.querySelector('.price__regular .price-item--regular');
      if (saleEl && saleEl.textContent !== priceText) saleEl.textContent = priceText;
      if (regEl && regEl.textContent !== priceText) regEl.textContent = priceText;

      if (moonbundle?.compareText) {
        const compareS = stickySeparatePrice.querySelector('.price__compare-price s');
        if (compareS && compareS.textContent !== moonbundle.compareText) {
          compareS.textContent = moonbundle.compareText;
        }
      }
    }
  };

  const syncAll = () => {
    document
      .querySelectorAll('sticky-atc[data-section]')
      .forEach((el) => syncSection(el.dataset.section));
  };

  const scheduleSyncAll = (() => {
    const debounced = rafDebounce(syncAll);
    return () => {
      debounced();
      setTimeout(syncAll, 0);
      setTimeout(syncAll, 50);
      setTimeout(syncAll, 200);
    };
  })();

  const bindObservers = () => {
    document.querySelectorAll('product-info[data-section]').forEach((productInfoEl) => {
      if (!(productInfoEl instanceof HTMLElement)) return;
      if (productInfoEl.dataset.stickyAtcPriceSyncObserved === 'true') return;
      productInfoEl.dataset.stickyAtcPriceSyncObserved = 'true';

      const observer = new MutationObserver(() => scheduleSyncAll());
      observer.observe(productInfoEl, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
    });
  };

  const init = () => {
    bindObservers();
    syncAll();
  };

  window.__stickyAtcPriceSync = {
    syncAll,
    syncSection,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
  document.addEventListener('change', scheduleSyncAll, true);
  document.addEventListener('click', scheduleSyncAll, true);
})();
<script src="{{ 'moonbundle-steps.js' | asset_url }}" defer="defer"></script>
