/**
 * ResultView — Game completion summary modal
 */
export class ResultView {
  constructor(container, { onPlayAgain, onChooseImage }) {
    this.container = container;
    this.onPlayAgain = onPlayAgain;
    this.onChooseImage = onChooseImage;

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';

    this.element.innerHTML = `
      <div class="modal-content glass-card" style="text-align: center; padding: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
        <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Puzzle Solved!</h2>
        <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Great job completing the puzzle!</p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">TIME</div>
            <div id="result-time" style="font-size: 1.2rem; font-weight: 700; color: var(--color-primary);">00:00</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">MOVES</div>
            <div id="result-moves" style="font-size: 1.2rem; font-weight: 700; color: var(--color-secondary);">0</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">DISTANCE</div>
            <div id="result-dist" style="font-size: 1.2rem; font-weight: 700; color: var(--color-accent);">0 px</div>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn btn-secondary" id="btn-result-home">Choose Image</button>
          <button class="btn btn-primary" id="btn-result-again">Play Again</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    this.element.querySelector('#btn-result-home').addEventListener('click', () => {
      this.hide();
      if (this.onChooseImage) this.onChooseImage();
    });

    this.element.querySelector('#btn-result-again').addEventListener('click', () => {
      this.hide();
      if (this.onPlayAgain) this.onPlayAgain();
    });
  }

  showStats({ timeStr, moves, distanceStr }) {
    this.element.querySelector('#result-time').textContent = timeStr || '00:00';
    this.element.querySelector('#result-moves').textContent = moves || 0;
    this.element.querySelector('#result-dist').textContent = distanceStr || '0 px';
    this.element.classList.add('active');
  }

  hide() {
    this.element.classList.remove('active');
  }
}
