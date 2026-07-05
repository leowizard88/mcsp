---
layout: base.njk
title: LA FINE DI MANCUSPIE
author: MANCUSPIE
date: 2026-07-06T00:00:00.000+02:00
tags: testi
excerpt: addio, è tutto finito. tutto
permalink: /testi/la-fine-di-mancuspie/
---
<style>
  .fine-mancuspie-page {
    background:
      radial-gradient(circle at 70% 18%, rgba(31, 28, 24, .10), transparent 28%),
      linear-gradient(115deg, var(--paper), var(--paper2));
  }

  .fine-mancuspie-inner {
    max-width: 980px;
  }

  .fine-mancuspie-figure-link {
    display: block;
    max-width: 620px;
    margin: 34px 0 34px;
    cursor: pointer;
  }

  .fine-mancuspie-figure {
    position: relative;
    min-height: 330px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background:
      radial-gradient(ellipse at 50% 62%, rgba(31, 28, 24, .10), transparent 42%),
      linear-gradient(135deg, rgba(255,255,255,.18), rgba(31,28,24,.04));
    overflow: hidden;
    transform-origin: 50% 80%;
    transition: filter .2s ease;
  }

  .fine-mancuspie-figure::before,
  .fine-mancuspie-figure::after {
    content: "";
    position: absolute;
    pointer-events: none;
  }

  .fine-mancuspie-figure::before {
    left: 19%;
    bottom: 61px;
    width: 58%;
    height: 126px;
    border: 2px solid rgba(31, 28, 24, .82);
    border-radius: 48% 54% 42% 46%;
    background:
      radial-gradient(circle at 25% 22%, rgba(130, 50, 75, .40), transparent 9%),
      radial-gradient(circle at 75% 22%, rgba(77, 60, 120, .36), transparent 9%),
      rgba(246, 242, 232, .62);
    box-shadow: 0 28px 60px rgba(31, 28, 24, .12);
    transform: rotate(2deg);
  }

  .fine-mancuspie-figure::after {
    left: 36%;
    top: 45px;
    width: 166px;
    height: 140px;
    border: 2px solid rgba(31, 28, 24, .82);
    border-radius: 49% 51% 44% 48%;
    background:
      linear-gradient(80deg, transparent 0 45%, rgba(141, 57, 72, .55) 46% 49%, transparent 50%),
      linear-gradient(100deg, transparent 0 53%, rgba(87, 68, 122, .50) 54% 57%, transparent 58%),
      rgba(246, 242, 232, .78);
    transform: rotate(-7deg);
  }

  .fine-mancuspie-limb {
    position: absolute;
    height: 4px;
    background: rgba(31, 28, 24, .82);
    transform-origin: left center;
  }

  .limb-a { width: 178px; left: 18%; bottom: 128px; transform: rotate(-20deg); }
  .limb-b { width: 204px; left: 59%; bottom: 140px; transform: rotate(-13deg); }
  .limb-c { width: 145px; left: 37%; bottom: 63px; transform: rotate(79deg); }
  .limb-d { width: 155px; left: 51%; bottom: 68px; transform: rotate(51deg); }

  .fine-mancuspie-eye {
    position: absolute;
    top: 105px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(31, 28, 24, .75);
    z-index: 2;
  }

  .eye-a { left: calc(36% + 55px); }
  .eye-b { left: calc(36% + 111px); }

  .fine-mancuspie-figure-link:hover .fine-mancuspie-figure {
    animation: fineOscilla .82s ease-in-out infinite alternate;
    filter: contrast(1.03) saturate(.92);
  }

  @keyframes fineOscilla {
    0% { transform: rotate(-1.6deg) translateY(0); }
    100% { transform: rotate(1.9deg) translateY(-5px); }
  }

  .fine-mancuspie-body {
    font-size: clamp(28px, 4vw, 54px);
    line-height: 1.05;
    max-width: 760px;
  }
</style>

<section class="single-page panel fine-mancuspie-page">
  <article class="single-inner fine-mancuspie-inner">
    <p class="section-kicker">Testi</p>
    <h1>LA FINE DI MANCUSPIE</h1>
    <p class="meta">MANCUSPIE</p>

    <a class="fine-mancuspie-figure-link" href="https://www.youtube.com/results?search_query=Coyote+Peterson" target="_blank" rel="noopener" aria-label="Apri un video di Coyote Peterson">
      <div class="fine-mancuspie-figure" role="img" aria-label="Hisoka morto, immagine stilizzata">
        <span class="fine-mancuspie-limb limb-a"></span>
        <span class="fine-mancuspie-limb limb-b"></span>
        <span class="fine-mancuspie-limb limb-c"></span>
        <span class="fine-mancuspie-limb limb-d"></span>
        <span class="fine-mancuspie-eye eye-a"></span>
        <span class="fine-mancuspie-eye eye-b"></span>
      </div>
    </a>

    <div class="single-body fine-mancuspie-body">
      <p>addio, è tutto finito.</p>
    </div>
  </article>
</section>
