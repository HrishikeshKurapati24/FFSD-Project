let sortColumn = "id";
let sortDirection = "asc";

// Fetch Transactions from Backend
async function fetchTransactions() {
    try {
        const response = await fetch("/payment_verification");
        const transactions = await response.json();
        renderTransactions(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
}

// Render Transactions
function renderTransactions(transactions) {
    const tableBody = document.querySelector("#payment-table tbody");
    tableBody.innerHTML = "";

    transactions.forEach(transaction => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${transaction.id}</td>
        <td>${transaction.brand}</td>
        <td>${transaction.influencer}</td>
        <td>${transaction.amount}</td>
        <td>${transaction.payment_date}</td>
        <td><span class="status ${transaction.status}">${transaction.status}</span></td>
        <td>${transaction.payment_method}</td>
        <td>${transaction.collab_type}</td>
        <td>${transaction.influencer_category}</td>
        <td class="actions">
          <button class="view" onclick="viewTransaction(${transaction.id})">View</button>
        </td>
      `;
        tableBody.appendChild(row);
    });
}

// View Transaction Details
async function viewTransaction(transactionId) {
    try {
        const response = await fetch(`/payment_verification/${transactionId}`);
        const transaction = await response.json();
        document.getElementById("modal-transaction-id").textContent = `Transaction #${transaction.id}`;
        document.getElementById("modal-brand").textContent = transaction.brand;
        document.getElementById("modal-influencer").textContent = transaction.influencer;
        document.getElementById("modal-amount").textContent = transaction.amount;
        document.getElementById("modal-payment-date").textContent = transaction.payment_date;
        document.getElementById("modal-status").textContent = transaction.status;
        document.getElementById("payment-modal").style.display = "block";
    } catch (error) {
        console.error("Error fetching transaction details:", error);
    }
}

// Approve Transaction
async function approveTransaction(transactionId) {
    await updateTransactionStatus(transactionId, "approved");
}

// Reject Transaction
async function rejectTransaction(transactionId) {
    await updateTransactionStatus(transactionId, "failed");
}

// Update Transaction Status
async function updateTransactionStatus(transactionId, status) {
    try {
        await fetch("/payment_verification/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: transactionId, status })
        });
        fetchTransactions();
        alert(`Transaction #${transactionId} updated to ${status}!`);
    } catch (error) {
        console.error("Error updating transaction:", error);
    }
}

// Close Modal
function closeModal() {
    document.getElementById("payment-modal").style.display = "none";
}

document.querySelector(".close").addEventListener("click", closeModal);
window.addEventListener("click", (event) => {
    const modal = document.getElementById("payment-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Fetch Transactions on Page Load
fetchTransactions();