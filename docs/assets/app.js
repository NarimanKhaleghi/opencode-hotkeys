;(() => {
  const html = document.documentElement
  const themeToggle = document.getElementById("themeToggle")
  const copyStatus = document.getElementById("copyStatus")
  const copyButton = document.getElementById("copyCommand")

  const updateThemeLabel = () => {
    if (!themeToggle) return
    const dark = html.dataset.theme === "dark"
    const label = html.dataset[dark ? "themeLight" : "themeDark"]
    if (!label) return
    themeToggle.setAttribute("aria-label", label)
    themeToggle.setAttribute("title", label)
  }

  const applyTheme = (theme) => {
    html.dataset.theme = theme
    updateThemeLabel()
    try {
      localStorage.setItem("hotkeys-theme", theme)
    } catch {}
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      applyTheme(html.dataset.theme === "dark" ? "light" : "dark")
    })
    updateThemeLabel()
  }

  const osTabs = Array.from(document.querySelectorAll(".os-tab"))
  if (osTabs.length) {
    const selectOsTab = (tab) => {
      const os = tab.dataset.os
      osTabs.forEach((node) => {
        const selected = node === tab
        node.setAttribute("aria-selected", String(selected))
        node.tabIndex = selected ? 0 : -1
      })
      document.querySelectorAll(".os-pane").forEach((pane) => {
        pane.hidden = pane.dataset.pane !== os
      })
      if (copyStatus) copyStatus.textContent = ""
    }

    osTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectOsTab(tab))
      tab.addEventListener("keydown", (event) => {
        const last = osTabs.length - 1
        let next = null
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
          next = index === last ? 0 : index + 1
        if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          next = index === 0 ? last : index - 1
        if (event.key === "Home") next = 0
        if (event.key === "End") next = last
        if (next === null) return
        event.preventDefault()
        osTabs[next].focus()
        selectOsTab(osTabs[next])
      })
    })
  }

  const activeCommand = () => {
    const pane = document.querySelector(".os-pane:not([hidden])")
    return pane
      ? pane
          .querySelector("pre")
          .innerText.replace(/^PS> |^\$ /gm, "")
          .trim()
      : ""
  }

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return
    }
    const area = document.createElement("textarea")
    area.value = text
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand("copy")
    area.remove()
    if (!copied) throw new Error("copy failed")
  }

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      if (!copyStatus) return
      try {
        await copyText(activeCommand())
        copyStatus.textContent = html.dataset.copied || "Copied"
      } catch {
        copyStatus.textContent = html.dataset.copyFailed || "Copy failed"
      }
      window.setTimeout(() => {
        copyStatus.textContent = ""
      }, 2400)
    })
  }
})()
