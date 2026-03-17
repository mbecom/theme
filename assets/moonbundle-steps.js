(() => {
  const STEP_1_TITLE = 'Choisir sa quantité';
  const STEP_2_TITLE = 'Choisir sa fréquence';

  const TRIMESTRIELLE_TITLE = 'Livraison Trimestrielle';
  const TRIMESTRIELLE_BENEFITS = [
    "-15% et livraison gratuite dès 29€ d'achat",
    'Sans engagement, annulez à tout moment',
    '30 jours satisfait ou remboursé',
  ];

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

  const createStepHeader = (stepNumber, title) => {
    const header = document.createElement('div');
    header.className = 'mb-step-header';
    header.dataset.mbStepHeader = String(stepNumber);

    const leftLine = document.createElement('span');
    leftLine.className = 'mb-step-header__line';
    leftLine.setAttribute('aria-hidden', 'true');

    const badge = document.createElement('span');
    badge.className = 'mb-step-header__badge';
    badge.textContent = String(stepNumber);
    badge.setAttribute('aria-hidden', 'true');

    const titleEl = document.createElement('span');
    titleEl.className = 'mb-step-header__title';
    titleEl.textContent = title;

    const rightLine = document.createElement('span');
    rightLine.className = 'mb-step-header__line';
    rightLine.setAttribute('aria-hidden', 'true');

    header.appendChild(leftLine);
    header.appendChild(badge);
    header.appendChild(titleEl);
    header.appendChild(rightLine);
    return header;
  };

  const ensureHeaderBefore = (targetEl, stepNumber, title) => {
    if (!(targetEl instanceof HTMLElement)) return;
    const prev = targetEl.previousElementSibling;
    if (prev instanceof HTMLElement && prev.dataset.mbStepHeader === String(stepNumber)) return;

    targetEl.parentNode?.insertBefore(createStepHeader(stepNumber, title), targetEl);
  };

  const isBadTextParent = (el) => {
    if (!(el instanceof HTMLElement)) return true;
    const tag = el.tagName;
    return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT';
  };

  const findTextParent = (root, regex) => {
    if (!(root instanceof HTMLElement)) return null;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node?.nodeValue) return NodeFilter.FILTER_REJECT;
        if (!regex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || isBadTextParent(parent)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNode = walker.nextNode();
    return textNode ? textNode.parentElement : null;
  };

  const getOptionCardFrom = (el) => {
    if (!(el instanceof HTMLElement)) return null;
    return (
      el.closest('[role="button"]') ||
      el.closest('.moonbundle-option') ||
      el.closest('label') ||
      el.closest('button') ||
      el.closest('.moonbundle-option-wrapper') ||
      null
    );
  };

  const findFrequencyContainerFromNoSub = (noSubCard) => {
    if (!(noSubCard instanceof HTMLElement)) return null;
    let el = noSubCard.parentElement;

    while (el && el !== document.body) {
      if (el.classList?.contains('moonbundle-options-vertical')) {
        el = el.parentElement;
        continue;
      }

      const cards = el.querySelectorAll('[role="button"]');
      if (cards.length >= 2) return el;

      el = el.parentElement;
    }
    return noSubCard.parentElement;
  };

  const createBenefitsEl = (benefits) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-frequency-benefits';

    const iconSvg =
      '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 10.5l4 4L16 6"/></svg>';

    benefits.forEach((text) => {
      const row = document.createElement('div');
      row.className = 'mb-frequency-benefit';

      const icon = document.createElement('span');
      icon.className = 'mb-frequency-benefit__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = iconSvg;

      const label = document.createElement('span');
      label.className = 'mb-frequency-benefit__text';
      label.textContent = text;

      row.appendChild(icon);
      row.appendChild(label);
      wrapper.appendChild(row);
    });

    return wrapper;
  };

  const enhanceWithin = (root) => {
    if (!(root instanceof HTMLElement)) return;

    const qtyRoot = root.querySelector('.moonbundle-options-vertical');
    if (qtyRoot) ensureHeaderBefore(qtyRoot, 1, STEP_1_TITLE);

    const noSubTextEl =
      findTextParent(root, /Achat\s+sans\s+abonnement/i) || findTextParent(root, /sans\s+abonnement/i);
    const noSubCard = noSubTextEl ? getOptionCardFrom(noSubTextEl) : null;
    const freqRoot = noSubCard ? findFrequencyContainerFromNoSub(noSubCard) : null;
    if (freqRoot) ensureHeaderBefore(freqRoot, 2, STEP_2_TITLE);

    const triTextEl = findTextParent(root, new RegExp(TRIMESTRIELLE_TITLE, 'i'));
    const triCard = triTextEl ? getOptionCardFrom(triTextEl) : null;
    if (triCard && !triCard.querySelector('.mb-frequency-benefits')) {
      const target = triCard.querySelector('.moonbundle-option-details') || triCard;
      target.appendChild(createBenefitsEl(TRIMESTRIELLE_BENEFITS));
    }
  };

  const applyEnhancements = () => {
    const productInfos = document.querySelectorAll('product-info[data-section]');
    if (productInfos.length) {
      productInfos.forEach((el) => enhanceWithin(el));
      return;
    }
    enhanceWithin(document.body);
  };

  const scheduleApply = (() => {
    const debounced = rafDebounce(applyEnhancements);
    return () => {
      debounced();
      setTimeout(applyEnhancements, 0);
      setTimeout(applyEnhancements, 100);
      setTimeout(applyEnhancements, 300);
    };
  })();

  const bindObservers = () => {
    document.querySelectorAll('product-info[data-section]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.dataset.mbStepsObserved === 'true') return;
      el.dataset.mbStepsObserved = 'true';

      const obs = new MutationObserver(() => scheduleApply());
      obs.observe(el, { subtree: true, childList: true });
    });
  };

  const init = () => {
    bindObservers();
    scheduleApply();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
  document.addEventListener('change', scheduleApply, true);
  document.addEventListener('click', scheduleApply, true);
})();
