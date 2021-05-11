import 'regenerator-runtime/runtime';
// import publickKey from './publicServerKey';
import _ from 'lodash';

// let swRegistration = null;
// let isSubscribed = false;

// // code for service worker
// if ('serviceWorker' in navigator && 'PushManager' in window) {
//     console.log('Service Worker and Push are supported');

//     navigator.serviceWorker.register('sw.js')
//         .then(function(swReg) {
//             console.log('Service Worker is registered', swReg);

//             swRegistration = swReg;
//             subscribePushMessage()
//         })
//         .catch(function(error) {
//             console.error('Service Worker Error', error);
//         });
// } else {
//     console.warn('Push messaging is not supported');
// }


const dates = [0,7,14,21,28].map(item => {
    const dateObj = new Date(new Date().setDate(new Date().getDate() + item));
    return dateObj.toLocaleDateString().replace(/\//g,'-');
})
const pinCode = prompt("PinCode"); // this is required
// const pinCode = 424101; // delete this

const vaccineData = dates.map(async (item) => {
    const apiUrl = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pinCode}&date=${item}`;
    const fetchData = await fetch(apiUrl);
    const getFetchData = await fetchData.json();
    return await getFetchData;
});

const finalCenters = Promise.all(vaccineData).then(res => {
    const centers = res.map(item => {
        return item.centers.map(center => {
            return center;
        })
    })
    return centers.flat();
});

const availableSlots = finalCenters.then(res => {
    console.log(res);
    const slot = res.filter(item => {
        return item.sessions.filter(session => {
            return session.available_capacity > 0;
        }).length !== 0; // set condition to !== 0
    }).flat();

    const finalAvSlot = _.cloneDeep(slot).filter(item => {
        const s = [...item.sessions];
        // console.log(item);
        const avSessions = s.filter(session => {
            // return session.date === '11-05-2021'; // delete this line
            return session.available_capacity > 0 // set this conditions
        });
        item.sessions = avSessions;
        if(item.sessions.length) {
            return item;
        }
    })
    return finalAvSlot.flat();
});

const finalPrintObj = (inputObj) => {
    let finalHtml = '<div class="info-wrap">';

    inputObj.forEach(item => {
        finalHtml += '<ul class="info-card">';
        finalHtml += `<li><strong>Name:</strong> ${item.name}</li>`;
        finalHtml += `<li><strong>Address:</strong> ${item.address}</li>`;
        finalHtml += `<li><strong>Fee Type:</strong> ${item.fee_type}</li>`;
        item.sessions.forEach(session => {
            finalHtml += `<li><strong>Date:</strong> ${session.date}</li>`;
            finalHtml += `<li><strong>Age Limit:</strong> ${session.min_age_limit}+</li>`;
            finalHtml += `<li><strong>Vaccine:</strong> ${session.vaccine}</li>`;
        });
        finalHtml += `<li><strong>Time: </strong> ${item.from} to ${item.to}</li>`
        finalHtml += '</ul>';
    })

    finalHtml += '</div>'

    return finalHtml;
}

// function subscribePushMessage() {
//     swRegistration.pushManager.subscribe({
//         userVisibleOnly: true,  
//         applicationServerKey: publickKey
//     })
//     .then(function(subscription) {
//         console.log('User IS subscribed.');
//         isSubscribed = true;
//         Notification.requestPermission().then((permission) => {
//             if(permission === 'granted') {
//                 let interval = setInterval(() => {
//                     availableSlots.then(res => {
//                         console.log('Notification permission granted');
//                         if(res) {
//                             var options = {
//                                 body: 'Vaccine Available!!',
//                                 silent: false
//                             }
//                             const not = new Notification('Vaccine Available', options);
//                             not.onclick = () => {
//                                 window.open('https://www.cowin.gov.in/home');
//                             }
//                         }
//                         document.getElementById('body').innerHTML = finalPrintObj(res);
//                         console.log(res);
//                         clearInterval(interval)
//                     });
//                 }, 60000);
//             }
//         })
//     });
// }

const checkSlot = (interval) => {
    availableSlots.then(res => {
        console.log('Notification permission granted');
        if(res) {
            var options = {
                body: 'Vaccine Available!!',
                silent: false
            }
            const not = new Notification('Vaccine Available', options);
            not.onclick = () => {
                clearInterval(interval)
                window.open('https://www.cowin.gov.in/home');
            }
        }
        document.getElementById('body').innerHTML = finalPrintObj(res);
        console.log(res);
    });
}

Notification.requestPermission().then((permission) => {
    if(permission === 'granted') {
        // let interval = setInterval(() => {
        //     availableSlots.then(res => {
        //         console.log('Notification permission granted');
        //         if(res) {
        //             var options = {
        //                 body: 'Vaccine Available!!',
        //                 silent: false
        //             }
        //             const not = new Notification('Vaccine Available', options);
        //             not.onclick = () => {
        //                 clearInterval(interval)
        //                 window.open('https://www.cowin.gov.in/home');
        //             }
        //         }
        //         document.getElementById('body').innerHTML = finalPrintObj(res);
        //         console.log(res);
        //     });
        // }, 1000);
        checkSlot();
        let interval = setInterval(() => checkSlot(interval), 60000)
    }
})