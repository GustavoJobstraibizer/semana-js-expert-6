export default class View {
  constructor() {
    this.btnStart = document.querySelector("#start");
    this.btnStop = document.querySelector("#stop");

    this.buttons = () => Array.from(document.querySelectorAll('button'))

    this.ignoreButtons = new Set(['unassigned'])
    async function onBtnClick() {}
    this.onBtnClick = onBtnClick

    this.DISABLED_BTN_TIMEOUT = 500
  }

  onLoad() {
    this.changeCommandBtnVisibility();
    this.btnStart.onclick = this.onStartClicked.bind(this)
  }

  changeCommandBtnVisibility(hide = true) {
    Array.from(document.querySelectorAll("[name=command]"))
    .forEach((btn) => {
      const fn = hide ? "add" : "remove";
      btn.classList[fn]("unassigned");

      function onClickReset() {}
      btn.onclick = onClickReset;
    });
  }

  configureOnBtnClick(fn) {
    this.onBtnClick = fn;
  }

  async onStartClicked({
    srcElement: {
      innerText
    }
  }) {
    const command = innerText.toLowerCase();
    this.onBtnClick(command);
    this.toggleBtnStart()
    this.changeCommandBtnVisibility(false)

    this.buttons()
      .filter(btn => this.noIsUnassignedButton(btn))
      .forEach(this.setupBtnAction.bind(this))
  }

  noIsUnassignedButton(btn) {
    const classes = Array.from(btn.classList)

    return !(!!classes.find(item => this.ignoreButtons.has(item)))
  }

  setupBtnAction(btn) {
    const text = btn.innerText.toLowerCase()

    if (text.includes('start')) return

    if (text.includes('stop')) {
      btn.onclick = this.onStopBtn.bind(this)
      return
    }

    btn.onclick = this.onCommandBtnClick.bind(this)
  }

  onStopBtn({
    srcElement: {
      innerText
    }
  }) {
    this.toggleBtnStart(false)
    this.changeCommandBtnVisibility(true)

    return this.onBtnClick(innerText)
  }

  async onCommandBtnClick(btn) {
    const {
      srcElement: {
        classList,
        innerText
      }
    } = btn

    this.toggleDisableCommandBtn(classList)
    await this.onBtnClick(innerText)

    setTimeout(() => this.toggleDisableCommandBtn(classList), this.DISABLED_BTN_TIMEOUT)
  }

  toggleDisableCommandBtn(classList) {
    if (!classList.contains('active')) {
      classList.add('active')
      return
    }

    classList.remove('active')
  }

  toggleBtnStart(active = true) {
    if (active) {
      this.btnStart.classList.add('hidden')
      this.btnStop.classList.remove('hidden')
      return
    }

    this.btnStop.classList.add('hidden')
    this.btnStart.classList.remove('hidden')
  }
}
