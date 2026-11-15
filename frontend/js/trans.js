// // Show page loader on internal link clicks
// document.addEventListener('DOMContentLoaded', () => {
//     const loader = document.createElement('div');
//     loader.id = 'page-loader';
//     loader.innerHTML = '<div class="spinner-border text-info mb-3" style="width: 3rem; height: 3rem;"></div><h5 class="text-white fw-bold">Loading...</h5>';
//     document.body.appendChild(loader);

//     document.querySelectorAll('a').forEach(link => {
//         // Only apply to internal links
//         if (link.hostname === window.location.hostname && !link.getAttribute('href').startsWith('#')) {
//             link.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 loader.classList.add('active');
//                 setTimeout(() => {
//                     window.location.href = link.href;
//                 }, 400); // 400ms delay to show the animation
//             });
//         }
//     });
// });