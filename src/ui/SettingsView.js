/**
 * SettingsView — User preferences and settings modal
 */
export class SettingsView {
  constructor(container, onClose) {
    this.container = container;
    this.onClose = onClose;

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';

    this.element.innerHTML = `
      <div class="modal-content glass-card" style="padding: 2rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <h2 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700;">Settings</h2>
          <button class="btn btn-icon" id="btn-close-settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600;">Sound Effects</div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">Snap & completion sounds</div>
            </div>
            <input type="checkbox" id="setting-sound" checked style="width: 20px; height: 20px; accent-color: var(--color-primary);" />
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600;">Snap Sensitivity</div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted);">Distance threshold for locking pieces</div>
            </div>
            <select id="setting-snap" style="background: var(--color-surface); padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--color-surface-border);">
              <option value="normal">Normal (25px)</option>
              <option value="strict">Strict (15px)</option>
              <option value="relaxed">Relaxed (40px)</option>
            </select>
          </div>
        </div>

        <div style="margin-top: 2rem; text-align: right;">
          <button class="btn btn-primary" id="btn-save-settings">Save & Close</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    const close = () => {
      this.hide();
      if (this.onClose) this.onClose();
    };

    this.element.querySelector('#btn-close-settings').addEventListener('click', close);
    this.element.querySelector('#btn-save-settings').addEventListener('click', close);
  }

  show() {
    this.element.classList.add('active');
  }

  hide() {
    this.element.classList.remove('active');
  }
}
