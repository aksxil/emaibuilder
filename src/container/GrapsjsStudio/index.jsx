import React, { useRef, useEffect, useState } from "react";
import StudioEditor from "@grapesjs/studio-sdk/react";
import "@grapesjs/studio-sdk/style";
import grapesjsPresetNewsletter from "grapesjs-preset-newsletter";
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import { configDotenv } from "dotenv";
configDotenv({ path: `${__dirname}/.env` });
// import juice from "juice"; // Optional, only needed if you're inlining styles



// Cloudinary config
const CLOUDINARY_UPLOAD_PRESET = configDotenv().CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"; // Replace with your Cloudinary upload preset
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "your_cloud_name"; // Replace with your Cloudinary cloud name

// Image preloader
const loadImages = (el) => {
  const imgs = el.querySelectorAll("img");
  const promises = [];
  imgs.forEach((img) => {
    if (!img.complete || img.naturalHeight === 0) {
      promises.push(
        new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        })
      );
    }
  });
  return Promise.all(promises);
};

// Upload function
// const uploadToCloudinary = async (files) => {
//   const uploads = await Promise.all(
//     files.map(async (file) => {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

//       const response = await fetch(
//         `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );

//       if (!response.ok) throw new Error("Upload to Cloudinary failed");
//       return await response.json();
//     })
//   );

//   return uploads.map((res) => ({
//     id: res.public_id,
//     src: res.secure_url,
//     name: res.original_filename,
//     mimeType: res.resource_type,
//     size: res.bytes,
//   }));
// };

const uploadToCloudinary = async ({ files }) => {   // <- destructure { files }
  const uploads = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload to Cloudinary failed");
      const res = await response.json();

      return {
        id: res.public_id,
        src: res.secure_url,
        name: res.original_filename,
        mimeType: res.resource_type,
        size: res.bytes,
      };
    })
  );

  return uploads;
};


const GrapesJsStudioBuilder = () => {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedCode, setExportedCode] = useState('');

  const editorRef = useRef(null);

  // Export Image
  const exportImage = async () => {
    const editor = editorRef.current;
    const wrapper = editor.Canvas.getBody().parentElement;
    await loadImages(wrapper);
    html2canvas(wrapper, { useCORS: true }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "email-template.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };
  // export html
  const exportHtmlWithCss = () => {
    const editor = editorRef.current;
    const html = editor.getHtml();
    const css = editor.getCss();

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${css}</style>
        <title>Email Template</title>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    setExportedCode(fullHtml.trim());
    setShowExportModal(true);
  };



  // Export PDF


  const exportPdf = async () => {
    const editor = editorRef.current;
    const html = editor.getHtml();
    const css = editor.getCss();

    // Inline the CSS into the HTML
    const inlinedHtml = `
      <html>
        <head>
          <style>
            ${css}
            body {
              
              color: #000 !important;
            }
            * {
              color: #000 !important;
             
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;

    // Create a container for the content
    const container = document.createElement("div");
    container.innerHTML = inlinedHtml;
    document.body.appendChild(container);

    // Wait for images to load
    await loadImages(container);

    // Generate PDF
    html2pdf()
      .from(container)
      .set({
        margin: 10,
        filename: "email-template.pdf",
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save()
      .finally(() => {
        document.body.removeChild(container);
      });
  };
  const buttonStyle = {
    padding: "8px 12px",
    background: "transparent",
    color: "#E9D5FF",
    fontSize: "13px",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
  };



  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Export Buttons */}
      <div
        style={{
          position: "absolute",
          top: "6px",
          left: "35%",
          zIndex: 6,
        }}
      >
        {showExportModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}>
            <div style={{
              background: '#1E1E1E',
              color: '#D4D4D4',
              padding: '20px',
              borderRadius: '10px',
              width: '85%',
              maxHeight: '80%',
              overflow: 'auto',
              position: 'relative',
              zIndex:"15",
              fontFamily: 'monospace',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            }}>
              <h2 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                Exported HTML + CSS
              </h2>

              <textarea
                value={exportedCode}
                readOnly
                style={{
                  width: '100%',
                  height: '350px',
                  padding: '12px',
                  background: '#0D0D0D',
                  color: '#D4D4D4',
                  fontSize: '13px',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  resize: 'vertical',
                }}
              />

              <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportedCode);
                    alert('Copied to clipboard!');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#6D28D9',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  📋 Copy Code
                </button>

                <button
                  onClick={() => setShowExportModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#333',
                    color: '#ccc',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ❌ Close
                </button>
              </div>
            </div>
          </div>
        )}


        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <button
            onClick={() => setShowExportOptions(!showExportOptions)}
            style={{
              padding: "4px 12px",
              background: "#6D28D9",
              color: "#fff",
              fontSize: "12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#5B21B6")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#6D28D9")}
          >
            Export ▼
          </button>

          {showExportOptions && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: "0",
                background: "#4C1D95",
                border: "1px solid #7C3AED",
                borderRadius: "4px",
                boxShadow: "0px 2px 5px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column",
                minWidth: "130px",
                zIndex: 3,
              }}
            >
              <button
                onClick={() => {
                  exportImage();
                  setShowExportOptions(false);
                }}
                style={buttonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = "#5B21B6")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Export Image
              </button>
              <button
                onClick={() => {
                  exportPdf();
                  setShowExportOptions(false);
                }}
                style={buttonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = "#5B21B6")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  exportHtmlWithCss();
                  setShowExportOptions(false);
                }}
                style={buttonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = "#5B21B6")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Export HTML
              </button>
            </div>
          )}
        </div>
      </div>





  
      {/* GrapesJS Editor */}
      <StudioEditor
        style={{ width: "100%", height: "100vh"}}
        onEditor={(editor) => {


          editorRef.current = editor;

          /////////////////////////////          

          // Remove 'icon' block after all blocks are loaded
          editor.on('load', () => {
            editor.BlockManager.remove('icon');
            editor.BlockManager.add('symbol-heart', {
              label: '♥ Heart',
              category: 'Symbols',
              content: '<div style="font-size:32px;">♥</div>',
            });

            editor.BlockManager.add('symbol-arrow', {
              label: '➜ Arrow',
              category: 'Symbols',
              content: '<div style="font-size:32px;">➜</div>',
            });

            editor.BlockManager.add('symbol-star', {
              label: '★ Star',
              category: 'Symbols',
              content: '<div style="font-size:32px;">★</div>',
            });

            editor.BlockManager.add('symbol-check', {
              label: '✔ Check',
              category: 'Symbols',
              content: '<div style="font-size:32px;">✔</div>',
            });

          });

        }}
        
        options={{
          theme: "light",
          projectData: {
            pages: [
              {
                name: "Email Template",
                component: `
                  <table class="email-body" style="width: 100%; padding: 20px;">
                    <tr>
                      <td><h1>Hello from GrapesJS</h1></td>
                    </tr>
                    <tr>
                      <td><img src="https://via.placeholder.com/300x100.png?text=GrapesJS" /></td>
                    </tr>
                  </table>
                `,
              },
            ],
          },
          assets: {
            storageType: "self",
            onUpload: uploadToCloudinary,
            onDelete: async ({ assets }) => {
              console.log("Handle delete manually:", assets);
            },
          },
          plugins: ["grapesjs-preset-newsletter"
          ],
          storage: false,
        }}
      />
    </div>
  );
};

export default GrapesJsStudioBuilder;
