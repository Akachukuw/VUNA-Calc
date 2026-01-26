var left = '';
var operator = '';
var right = '';
var steps = [];
var MAX_STEPS = 6;

/* ===============================
   ERROR & SUGGESTION HANDLING
================================ */

function showError(message, suggestion = "") {
  const errorBox = document.getElementById("error-box");
  if (!errorBox) return;

  errorBox.innerHTML = `
    <strong>Error:</strong> ${message}
    ${suggestion ? `<div class="suggestion">💡 ${suggestion}</div>` : ""}
  `;
  errorBox.style.display = "block";
}

function clearError() {
  const errorBox = document.getElementById("error-box");
  if (!errorBox) return;
  errorBox.innerHTML = "";
  errorBox.style.display = "none";
}

/* ===============================
   INPUT FUNCTIONS
================================ */

function appendToResult(value) {
    clearError();

    const target = operator.length === 0 ? left : right;

    // Prevent multiple decimals
    if (value === "." && target.includes(".")) {
        showError("Invalid number format", "You already added a decimal point.");
        return;
    }

    if (operator.length === 0) {
        left += value.toString();
    } else {
        right += value.toString();
    }
    updateResult();
}

function bracketToResult(value) {
    clearError();
    if (operator.length === 0) {
        left += value;
    } else {
        right += value;
    }
    updateResult();
}

function backspace() {
    clearError();
    if (right.length > 0) {
        right = right.slice(0, -1);
    } else if (operator.length > 0) {
        operator = '';
    } else if (left.length > 0) {
        left = left.slice(0, -1);
    }
    updateResult();
}

function operatorToResult(value) {
    clearError();

    if (left.length === 0) {
        showError("No number entered", "Enter a number before choosing an operator.");
        return;
    }

    if (operator && right.length === 0) {
        showError("Operator already selected", "Enter the next number.");
        return;
    }

    if (right.length > 0) {
        calculateResult();
    }

    operator = value;
    updateResult();
}

function clearResult() {
  left = "";
  right = "";
  operator = "";
  steps = [];

  clearError();

  document.getElementById("word-result").innerHTML = "";
  document.getElementById("word-area").style.display = "none";
  document.getElementById("steps").innerText = "";

  updateResult();
}

/* ===============================
   CALCULATION WITH ERROR CHECKS
================================ */

function calculateResult() {
  clearError();

  if (left.length === 0 || operator.length === 0 || right.length === 0) {
    showError(
      "Incomplete expression",
      "Enter two numbers and an operator before pressing equals."
    );
    return;
  }

  const l = parseFloat(left);
  const r = parseFloat(right);

  if (isNaN(l) || isNaN(r)) {
    showError("Invalid number", "Please enter valid numeric values.");
    return;
  }

  let result;

  switch (operator) {
    case "+":
      result = l + r;
      break;
    case "-":
      result = l - r;
      break;
    case "*":
      result = l * r;
      break;
    case "/":
      if (r === 0) {
        showError("Division by zero", "You cannot divide a number by zero.");
        return;
      }
      result = l / r;
      break;
    default:
      showError("Unknown operation");
      return;
  }

  if (steps.length < MAX_STEPS) {
    steps.push(`Step ${steps.length + 1}: ${l} ${operator} ${r} = ${result}`);
  }

  left = result.toString();
  operator = "";
  right = "";

  updateStepsDisplay();
  updateResult();
}

/* ===============================
   NUMBER TO WORDS
================================ */

function numberToWords(num) {
    if (num === 'Error') return 'Error';
    if (num === '') return '';

    const n = parseFloat(num);
    if (isNaN(n)) return '';
    if (n === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    function convertGroup(val) {
        let res = '';
        if (val >= 100) {
            res += ones[Math.floor(val / 100)] + ' Hundred ';
            val %= 100;
        }
        if (val >= 10 && val <= 19) {
            res += teens[val - 10] + ' ';
        } else if (val >= 20) {
            res += tens[Math.floor(val / 10)] + (val % 10 !== 0 ? '-' + ones[val % 10] : '') + ' ';
        } else if (val > 0) {
            res += ones[val] + ' ';
        }
        return res.trim();
    }

    let sign = n < 0 ? 'Negative ' : '';
    let absN = Math.abs(n);
    let parts = absN.toString().split('.');
    let integerPart = parseInt(parts[0]);
    let decimalPart = parts[1];

    let wordArr = [];
    if (integerPart === 0) {
        wordArr.push('Zero');
    } else {
        let scaleIdx = 0;
        while (integerPart > 0) {
            let chunk = integerPart % 1000;
            if (chunk > 0) {
                let chunkWords = convertGroup(chunk);
                wordArr.unshift(chunkWords + (scales[scaleIdx] ? ' ' + scales[scaleIdx] : ''));
            }
            integerPart = Math.floor(integerPart / 1000);
            scaleIdx++;
        }
    }

    let result = sign + wordArr.join(', ').trim();

    if (decimalPart) {
        result += ' Point';
        for (let digit of decimalPart) {
            result += ' ' + (digit === '0' ? 'Zero' : ones[parseInt(digit)]);
        }
    }

    return result.trim();
}

/* ===============================
   DISPLAY & SPEECH
================================ */

function updateResult() {
    const display = left + (operator ? ' ' + operator + ' ' : '') + right;
    document.getElementById('result').value = display || '0';

    const wordResult = document.getElementById('word-result');
    const wordArea = document.getElementById('word-area');

    if (left && !operator && !right) {
        wordResult.innerHTML =
          '<span class="small-label">Result in words</span><strong>' +
          numberToWords(left) +
          '</strong>';
        wordArea.style.display = 'flex';
    } else {
        wordResult.innerHTML = '';
        wordArea.style.display = 'none';
    }
    enableSpeakButton();
}

function speakResult() {
    const speakBtn = document.getElementById('speak-btn');
    const wordResultEl = document.getElementById('word-result');
    const words = wordResultEl.querySelector('strong')?.innerText || '';

    if (!words) return;

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speakBtn.classList.remove('speaking');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(words);
    utterance.rate = 0.9;
    utterance.onstart = () => speakBtn.classList.add('speaking');
    utterance.onend = () => speakBtn.classList.remove('speaking');
    window.speechSynthesis.speak(utterance);
}

function enableSpeakButton() {
    const speakBtn = document.getElementById('speak-btn');
    if (!speakBtn) return;
    const hasContent = document.getElementById('word-result').innerHTML.trim().length > 0;
    speakBtn.disabled = !hasContent;
}

function updateStepsDisplay() {
  const stepsDiv = document.getElementById("steps");
  if (!stepsDiv) return;
  stepsDiv.innerText = steps.join("\n");
}
