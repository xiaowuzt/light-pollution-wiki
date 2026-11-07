'use strict';
window.WikiShowcase = (() => {
  let controller, observer, activeVideo;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function markup(spell, lang) {
    const media = window.WIKI_FOOTAGE?.spells[spell.id];
    if (!media) return '';
    const t = (zh, en) => lang === 'zh' ? zh : en;
    const name = esc(spell.name[lang]);
    return `<section class="spell-showcase" aria-labelledby="showcase-title">
      <h2 id="showcase-title">${t('实机演示', 'In-game showcase')}</h2>
      <figure class="gameplay-media">
        <video id="spell-video" controls playsinline preload="none" poster="${esc(media.poster)}" width="${media.width}" height="${media.height}" aria-label="${name} · ${t('实机效果录像', 'in-game effect recording')}">
          <source src="${esc(media.video)}" type="video/mp4">
          ${t('此浏览器不支持视频播放。', 'Your browser does not support video playback.')}
        </video>
        <figcaption>
          <strong>${t('Minecraft 实机录像', 'Recorded in Minecraft')} <span>· ${t('I 级', 'Tier I')} · ${t('正常速度', 'Normal speed')}</span></strong>
          <p>${t('Minecraft 1.20.1 / Forge 47.4.22，2026-11-07 开发版。未使用外部光影包，无声录像；效果以你安装的版本为准。', 'Minecraft 1.20.1 / Forge 47.4.22, development build from 2026-11-07. No external shader pack. Silent recording; effects may differ in your installed version.')}</p>
          <div class="showcase-actions"><button type="button" class="btn" id="replay-spell">${t('从头播放', 'Replay')}</button><a href="${esc(media.video)}" target="_blank" rel="noopener">${t('单独打开视频', 'Open video')} ↗</a><span>${Math.round(media.durationSeconds)} ${t('秒', 'sec')}</span></div>
          <p id="video-message" class="showcase-message" role="status" hidden></p>
        </figcaption>
      </figure>
    </section>`;
  }
  function mount(lang) {
    const video = document.getElementById('spell-video');
    if (!video) return;
    activeVideo = video;
    controller = new AbortController();
    const {signal} = controller;
    const message = document.getElementById('video-message');
    const fail = () => {
      message.hidden = false;
      message.textContent = lang === 'zh' ? '视频暂时无法播放，可使用“单独打开视频”重试。' : 'The video could not be played. Try “Open video”.';
    };
    video.addEventListener('error', fail, {signal});
    video.querySelector('source').addEventListener('error', fail, {signal});
    document.getElementById('replay-spell').addEventListener('click', async () => {
      video.currentTime = 0;
      message.hidden = true;
      try { await video.play(); } catch { fail(); }
    }, {signal});
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); }, {signal});
    observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting && !document.fullscreenElement) video.pause();
    });
    observer.observe(video);
  }
  function reset() {
    activeVideo?.pause();
    controller?.abort(); observer?.disconnect();
    activeVideo = controller = observer = null;
  }
  return {markup, mount, reset};
})();
