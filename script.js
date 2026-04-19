    let networkData = JSON.parse(localStorage.getItem('core_net_v7')) || [];
    let recruiterMode = false;

    window.onload = renderTable;

    function showToast(msg) {
        const container = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerText = msg;
        container.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 400);
        }, 3000);
    }

    // --- Core Rendering Logic ---
    function renderTable() {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        const stats = {};

        networkData.forEach(item => {
            // Stats calculation
            const norm = (item.college || "OTHER").toUpperCase().split(' ')[0];
            stats[norm] = (stats[norm] || 0) + 1;

            const tr = document.createElement('tr');
            if (item.post && item.post.toUpperCase().includes('A+')) tr.className = 'row-premium';

            tr.innerHTML = `
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <a class="name-link" onclick="openLinkedIn('${item.link}')">${item.name}</a>
                        <span onclick="loadEdit(${item.id})" 
                              style="font-size: 0.65rem; color: var(--text-dim); cursor: pointer; margin-top: 5px; letter-spacing: 1px; font-weight: 600;">
                              MOD_DATA // ${item.id.toString().slice(-4)}
                        </span>
                    </div>
                </td>
                <td class="hide-in-recruiter" style="cursor: pointer" onclick="loadEdit(${item.id})">${item.college}</td>
                <td><span style="color: var(--accent); font-weight: 800;">${item.post}</span></td>
                <td class="hide-in-recruiter">
                    <button class="status-btn ${item.sent ? 'active' : ''}" onclick="updateStatus(${item.id}, 'sent')">SENT</button>
                    <button class="status-btn ${item.made ? 'active' : ''}" onclick="updateStatus(${item.id}, 'MADE')">MADE</button>
                </td>
                <td>
                    <button onclick="deleteItem(${item.id})" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 1.2rem; transition: 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">&times;</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('totalCount').innerText = `Monitoring ${networkData.length} active nodes in network`;
        renderStats(stats);
    }

    function renderStats(stats) {
        const container = document.getElementById('collegeStats');
        const total = networkData.length || 1;
        container.innerHTML = `<p style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: 1.2rem; font-weight: 800; letter-spacing: 1.5px;">Org Distribution</p>`;
        
        Object.entries(stats).sort((a,b) => b[1] - a[1]).forEach(([name, count]) => {
            const pct = (count / total) * 100;
            container.innerHTML += `
                <div class="stat-card">
                    <div class="stat-header"><span>${name}</span><span>${count}</span></div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
                </div>`;
        });
    }

    // --- Link Handling ---
    function openLinkedIn(url) {
        if (!url || url === '#' || url.trim() === "") {
            showToast("No LinkedIn URL found for this identity");
            return;
        }
        const validUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(validUrl, '_blank');
    }

    // --- Form & Data Logic ---
    function loadEdit(id) {
        if (recruiterMode) return;
        const item = networkData.find(x => x.id === id);
        if (!item) return;

        document.getElementById('editId').value = item.id;
        document.getElementById('nameIn').value = item.name;
        document.getElementById('orgIn').value = item.college;
        document.getElementById('qualIn').value = item.post;
        document.getElementById('linkIn').value = item.link === '#' ? '' : item.link;

        document.getElementById('form-section').classList.add('editing');
        document.getElementById('mainActionBtn').innerText = "Update Identity";
        document.getElementById('cancelBtn').style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast("Accessing " + item.name + "'s record...");
    }

    function clearForm() {
        document.getElementById('editId').value = "";
        ["nameIn", "orgIn", "qualIn", "linkIn"].forEach(id => document.getElementById(id).value = '');
        document.getElementById('form-section').classList.remove('editing');
        document.getElementById('mainActionBtn').innerText = "+ Add Connection";
        document.getElementById('cancelBtn').style.display = "none";
    }

    function saveEntry() {
        const id = document.getElementById('editId').value;
        const name = document.getElementById('nameIn').value.trim();
        const org = document.getElementById('orgIn').value.trim();
        const link = document.getElementById('linkIn').value.trim();
        
        if (!name || !org) return showToast("Name and Org are required fields");

        if (id) {
            const index = networkData.findIndex(x => x.id == id);
            networkData[index] = {
                ...networkData[index],
                name,
                college: org,
                post: document.getElementById('qualIn').value || 'A',
                link: link || '#'
            };
            showToast("Identity Overwritten");
        } else {
            networkData.push({
                id: Date.now(),
                name, college: org,
                post: document.getElementById('qualIn').value || 'A',
                link: link || '#',
                sent: false, made: false
            });
            showToast("New Node Added to Core");
        }

        syncData();
        clearForm();
    }

    function updateStatus(id, key) {
        const item = networkData.find(x => x.id === id);
        if (item) { 
            item[key.toLowerCase()] = !item[key.toLowerCase()]; 
            syncData(); 
        }
    }

    function deleteItem(id) {
        if (confirm("Permanently erase this connection from core?")) {
            networkData = networkData.filter(x => x.id !== id);
            syncData();
            showToast("Record Erased");
        }
    }

    function syncData() {
        localStorage.setItem('core_net_v7', JSON.stringify(networkData));
        renderTable();
    }

    function runFilters() {
        const q = document.getElementById('searchBar').value.toLowerCase();
        document.querySelectorAll('tbody tr').forEach(tr => {
            tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    }

    function toggleRecruiterMode() {
        recruiterMode = !recruiterMode;
        document.body.classList.toggle('recruiter-active');
        document.getElementById('mode-label').innerText = recruiterMode ? "RECRUITER MODE" : "STANDARD MODE";
        document.getElementById('main-title').innerText = recruiterMode ? "Talent Pipeline" : "Network Manager";
        if (recruiterMode) clearForm();
    }

    // --- External Tools ---
    function exportToFile() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(networkData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `CoreNet_Backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast("Backup Created");
    }

    function importFromFile(e) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                networkData = JSON.parse(ev.target.result);
                syncData();
                showToast("Intelligence Restored");
            } catch (err) {
                showToast("Error: Invalid File Format");
            }
        };
        reader.readAsText(e.target.files[0]);
    }

    async function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Core Intelligence: Network Report", 14, 20);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        const rows = networkData.map(i => [i.name, i.college, i.post, i.sent?'YES':'NO', i.made?'YES':'NO']);
        
        doc.autoTable({
            startY: 35,
            head: [['Name', 'Organization', 'Tier', 'Msg Sent', 'Connected']],
            body: rows,
            headStyles: { fillColor: [0, 242, 255], textColor: [0,0,0], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 }
        });

        doc.save(`CoreNet_Report_${Date.now()}.pdf`);
        showToast("PDF Exported Successfully");
    }