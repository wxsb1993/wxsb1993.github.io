(() => {
  function complement(seq) {
    const map = { A: "T", T: "A", C: "G", G: "C" };
    return seq.split("").map(ch => map[ch]).join("");
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const topTemplate = "ATGCCGTAACGTAGCTA";
  const bottomTemplate = complement(topTemplate);
  const leftPart = topTemplate.slice(0, 6);
  const rightPart = topTemplate.slice(-6);
  const leftBottomPart = bottomTemplate.slice(0, 6);
  const rightBottomPart = bottomTemplate.slice(-6);

  let orderSelection = [];
  let selectedPrimers = [];
  let currentCycle = 0;
  let running = false;
  let selectedQuiz = "";

  const correctOrder = ["变性", "退火", "聚合"];
  const primerOptions = ["5'-ATGCCG-3'", "5'-TAGCTA-3'", "5'-GGCATC-3'", "5'-CGTTAC-3'"];
  const correctPrimers = ["5'-ATGCCG-3'", "5'-TAGCTA-3'"];

  const parentDna = document.getElementById("parentDna");
  const progressText = document.getElementById("progressText");
  const progressSteps = document.querySelectorAll(".progress-step");
  const orderList = document.getElementById("orderList");
  const processButtons = document.querySelectorAll(".process-btn");
  const resetOrder = document.getElementById("resetOrder");
  const checkOrderBtn = document.getElementById("checkOrderBtn");
  const orderFeedback = document.getElementById("orderFeedback");

  const conditionSection = document.getElementById("conditionSection");
  const denatureTemp = document.getElementById("denatureTemp");
  const annealTemp = document.getElementById("annealTemp");
  const extendTemp = document.getElementById("extendTemp");
  const denatureTempLabel = document.getElementById("denatureTempLabel");
  const annealTempLabel = document.getElementById("annealTempLabel");
  const extendTempLabel = document.getElementById("extendTempLabel");
  const checkConditionBtn = document.getElementById("checkConditionBtn");
  const conditionFeedback = document.getElementById("conditionFeedback");

  const primerSection = document.getElementById("primerSection");
  const primerGrid = document.getElementById("primerGrid");
  const checkPrimerBtn = document.getElementById("checkPrimerBtn");
  const primerFeedback = document.getElementById("primerFeedback");

  const simulationSection = document.getElementById("simulationSection");
  const runFirstCycleBtn = document.getElementById("runFirstCycleBtn");
  const nextCycleBtn = document.getElementById("nextCycleBtn");
  const stagePanel = document.getElementById("stagePanel");
  const productPanel = document.getElementById("productPanel");
  const cycleIndicator = document.getElementById("cycleIndicator");

  const quizSection = document.getElementById("quizSection");
  const quizOptions = document.querySelectorAll(".quiz-option");
  const submitQuizBtn = document.getElementById("submitQuizBtn");
  const quizFeedback = document.getElementById("quizFeedback");

  const logPanel = document.getElementById("logPanel");

  if (!parentDna || !orderList || !logPanel || !checkOrderBtn) {
    return;
  }

  function setFeedback(node, type, message) {
    if (!node) {
      return;
    }
    node.className = "feedback";
    if (!type || !message) {
      node.textContent = "";
      return;
    }
    node.classList.add(type);
    node.textContent = message;
  }

  function clearFeedbacks() {
    setFeedback(orderFeedback, "", "");
    setFeedback(conditionFeedback, "", "");
    setFeedback(primerFeedback, "", "");
    setFeedback(quizFeedback, "", "");
  }

  function addLog(content) {
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = content;
    logPanel.prepend(item);
  }

  function updateProgress(step) {
    if (progressText) {
      progressText.textContent = `${step}/4`;
    }
    progressSteps.forEach(node => {
      const nodeStep = Number(node.dataset.step);
      node.classList.remove("active", "done");
      if (nodeStep < step) {
        node.classList.add("done");
      } else if (nodeStep === step) {
        node.classList.add("active");
      }
    });
  }

  function renderParentDna() {
    parentDna.innerHTML = "";
    const block = document.createElement("div");
    block.className = "dna-block";
    block.innerHTML = `
      <div class="strand">
        <span>5'</span>
        <span class="line-seq"><span>${leftPart}</span><span class="mid-line"></span><span>${rightPart}</span></span>
        <span>3'</span>
      </div>
      <div class="strand">
        <span>3'</span>
        <span class="line-seq"><span>${leftBottomPart}</span><span class="mid-line"></span><span>${rightBottomPart}</span></span>
        <span>5'</span>
      </div>
    `;
    parentDna.appendChild(block);
  }

  function renderOrder() {
    orderList.innerHTML = "";
    orderSelection.forEach(item => {
      const tag = document.createElement("div");
      tag.className = "tag";
      tag.textContent = item;
      orderList.appendChild(tag);
    });
  }

  function renderPrimerOptions() {
    primerGrid.innerHTML = "";
    primerOptions.forEach(seq => {
      const option = document.createElement("div");
      option.className = "primer-option";
      option.textContent = seq;
      option.addEventListener("click", () => {
        if (selectedPrimers.includes(seq)) {
          selectedPrimers = selectedPrimers.filter(item => item !== seq);
        } else if (selectedPrimers.length < 2) {
          selectedPrimers.push(seq);
        }
        document.querySelectorAll(".primer-option").forEach(item => {
          item.classList.toggle("active", selectedPrimers.includes(item.textContent));
        });
      });
      primerGrid.appendChild(option);
    });
  }

  function renderDenatureStage(cycle) {
    stagePanel.innerHTML = "<h4>变性</h4>";
    const board = document.createElement("div");
    board.className = "stage-board";
    const templates = Math.pow(2, cycle - 1) * 2;
    for (let i = 0; i < templates; i += 1) {
      const isTopTemplate = i % 2 === 0;
      const card = document.createElement("div");
      card.className = "template-card";
      card.innerHTML = `
        <h4>模板链 ${i + 1}</h4>
        <div class="strand">
          <span>${isTopTemplate ? "5'" : "3'"}</span>
          <span>${isTopTemplate ? topTemplate : bottomTemplate}</span>
          <span>${isTopTemplate ? "3'" : "5'"}</span>
        </div>
      `;
      board.appendChild(card);
    }
    stagePanel.appendChild(board);
    addLog(`<strong>第 ${cycle} 轮 - 变性</strong><br>双链 DNA 解开为模板单链`);
  }

  function renderAnnealStage(cycle) {
    stagePanel.innerHTML = "<h4>退火</h4>";
    const board = document.createElement("div");
    board.className = "stage-board";
    const templates = Math.pow(2, cycle - 1) * 2;
    for (let i = 0; i < templates; i += 1) {
      const isTopTemplate = i % 2 === 0;
      const card = document.createElement("div");
      card.className = "template-card";
      card.innerHTML = `
        <h4>模板链 ${i + 1}</h4>
        <div class="strand">
          <span>${isTopTemplate ? "5'" : "3'"}</span>
          <span>${isTopTemplate ? topTemplate : bottomTemplate}</span>
          <span>${isTopTemplate ? "3'" : "5'"}</span>
        </div>
        <div class="strand" style="color:#2458cf;">
          <span>引物</span>
          <span>${isTopTemplate ? "5'-TAGCTA-3'" : "5'-ATGCCG-3'"}</span>
        </div>
      `;
      board.appendChild(card);
    }
    stagePanel.appendChild(board);
    addLog(`<strong>第 ${cycle} 轮 - 退火</strong><br>引物 5' 端与模板 3' 端互补配对`);
  }

  async function animateExtensionStage(cycle) {
    stagePanel.innerHTML = "<h4>聚合</h4>";
    const board = document.createElement("div");
    board.className = "stage-board";
    const templates = Math.pow(2, cycle - 1) * 2;
    const growingNodes = [];

    for (let i = 0; i < templates; i += 1) {
      const isTopTemplate = i % 2 === 0;
      const card = document.createElement("div");
      card.className = "template-card";
      card.innerHTML = `
        <h4>模板链 ${i + 1}</h4>
        <div class="strand">
          <span>${isTopTemplate ? "5'" : "3'"}</span>
          <span>${isTopTemplate ? topTemplate : bottomTemplate}</span>
          <span>${isTopTemplate ? "3'" : "5'"}</span>
        </div>
        <div class="strand">
          <span>${isTopTemplate ? "3'" : "5'"}</span>
          <span class="growing-seq"></span>
          <span>${isTopTemplate ? "5'" : "3'"}</span>
        </div>
      `;
      growingNodes.push(card.querySelector(".growing-seq"));
      board.appendChild(card);
    }
    stagePanel.appendChild(board);

    for (let index = 0; index < topTemplate.length; index += 1) {
      for (let i = 0; i < growingNodes.length; i += 1) {
        const base = i % 2 === 0 ? bottomTemplate[index] : topTemplate[index];
        const unit = document.createElement("span");
        unit.className = "nucleotide";
        unit.textContent = base;
        growingNodes[i].appendChild(unit);
      }
      await wait(140);
    }
    addLog(`<strong>第 ${cycle} 轮 - 聚合</strong><br>核苷酸逐个加入完成新链延伸`);
  }

  function renderProducts(cycle) {
    const count = Math.pow(2, cycle);
    productPanel.innerHTML = `<h4 style="margin:10px 0 6px;">第 ${cycle} 轮结束：${count} 个 DNA 分子</h4>`;
    const grid = document.createElement("div");
    grid.className = "products-grid";
    for (let i = 0; i < count; i += 1) {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <h4>子代 DNA ${i + 1}</h4>
        <div class="strand"><span>5'</span><span>${topTemplate}</span><span>3'</span></div>
        <div class="strand"><span>3'</span><span>${bottomTemplate}</span><span>5'</span></div>
      `;
      grid.appendChild(card);
    }
    productPanel.appendChild(grid);
  }

  async function runCycle(cycle) {
    running = true;
    cycleIndicator.textContent = `当前循环：${cycle}`;
    renderDenatureStage(cycle);
    await wait(1200);
    renderAnnealStage(cycle);
    await wait(1200);
    await animateExtensionStage(cycle);
    renderProducts(cycle);
    addLog(`<strong>第 ${cycle} 轮完成</strong><br>DNA 分子总数：${Math.pow(2, cycle)}`);
    currentCycle = cycle;
    running = false;
    if (currentCycle === 1) {
      runFirstCycleBtn.disabled = true;
      nextCycleBtn.disabled = false;
    }
    if (currentCycle >= 3) {
      nextCycleBtn.disabled = true;
      quizSection.classList.remove("hidden");
    }
  }

  processButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setFeedback(orderFeedback, "", "");
      if (orderSelection.length >= 3) {
        return;
      }
      const step = btn.textContent.trim();
      if (orderSelection.includes(step)) {
        return;
      }
      orderSelection.push(step);
      renderOrder();
    });
  });

  resetOrder.addEventListener("click", () => {
    orderSelection = [];
    renderOrder();
    setFeedback(orderFeedback, "", "");
  });

  checkOrderBtn.addEventListener("click", () => {
    const pass = orderSelection.length === 3 && orderSelection.every((item, idx) => item === correctOrder[idx]);
    if (!pass) {
      setFeedback(orderFeedback, "error", "顺序错误，请按“变性 → 退火 → 聚合”重新排序。");
      return;
    }
    setFeedback(orderFeedback, "success", "排序正确，可以进入下一步。");
    conditionSection.classList.remove("hidden");
    updateProgress(2);
    addLog("<strong>步骤排序完成</strong><br>顺序：变性 → 退火 → 聚合");
  });

  denatureTemp.addEventListener("input", () => {
    denatureTempLabel.textContent = denatureTemp.value + "°C";
    setFeedback(conditionFeedback, "", "");
  });
  annealTemp.addEventListener("input", () => {
    annealTempLabel.textContent = annealTemp.value + "°C";
    setFeedback(conditionFeedback, "", "");
  });
  extendTemp.addEventListener("input", () => {
    extendTempLabel.textContent = extendTemp.value + "°C";
    setFeedback(conditionFeedback, "", "");
  });

  checkConditionBtn.addEventListener("click", () => {
    const denaturePurpose = document.getElementById("denaturePurpose").value;
    const annealPurpose = document.getElementById("annealPurpose").value;
    const extendPurpose = document.getElementById("extendPurpose").value;
    const denatureVal = Number(denatureTemp.value);
    const annealVal = Number(annealTemp.value);
    const extendVal = Number(extendTemp.value);

    const denatureOk = denatureVal === 95 && denaturePurpose === "split";
    const annealOk = annealVal >= 55 && annealVal <= 68 && annealPurpose === "bind";
    const extendOk = extendVal === 72 && extendPurpose === "extend";

    if (!denatureOk || !annealOk || !extendOk) {
      setFeedback(conditionFeedback, "error", "条件不正确，请检查三步温度范围与对应目的后再进入下一步。");
      return;
    }

    setFeedback(conditionFeedback, "success", "条件正确，可以进入引物选择。");
    primerSection.classList.remove("hidden");
    updateProgress(3);
    addLog("<strong>步骤条件完成</strong><br>变性 95°C，退火 55-68°C，聚合 72°C");
  });

  checkPrimerBtn.addEventListener("click", () => {
    const pass = selectedPrimers.length === 2 && correctPrimers.every(primer => selectedPrimers.includes(primer));
    if (!pass) {
      setFeedback(primerFeedback, "error", "引物选择错误，请从 4 个中选出正确的 2 个。");
      return;
    }
    setFeedback(primerFeedback, "success", "引物选择正确，可以开始第一轮循环。");
    simulationSection.classList.remove("hidden");
    updateProgress(4);
    addLog("<strong>引物选择完成</strong><br>两个引物均按 5' 到 3' 书写并定位到模板链");
  });

  runFirstCycleBtn.addEventListener("click", async () => {
    if (running || currentCycle !== 0) {
      return;
    }
    clearFeedbacks();
    await runCycle(1);
  });

  nextCycleBtn.addEventListener("click", async () => {
    if (running || currentCycle < 1 || currentCycle >= 3) {
      return;
    }
    clearFeedbacks();
    await runCycle(currentCycle + 1);
  });

  quizOptions.forEach(option => {
    option.addEventListener("click", () => {
      selectedQuiz = option.dataset.value || "";
      quizOptions.forEach(item => item.classList.remove("active"));
      option.classList.add("active");
      setFeedback(quizFeedback, "", "");
    });
  });

  submitQuizBtn.addEventListener("click", () => {
    if (selectedQuiz !== "2^n") {
      setFeedback(quizFeedback, "error", "答案错误，请重新选择。");
      return;
    }
    setFeedback(quizFeedback, "success", "答案正确。");
    addLog("<strong>选择题完成</strong><br>PCR n 次循环后 DNA 分子数：2^n");
    submitQuizBtn.disabled = true;
  });

  renderParentDna();
  updateProgress(1);
  renderOrder();
  renderPrimerOptions();
  addLog("<strong>已就绪</strong><br>从步骤排序开始");
})();
