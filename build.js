const fs = require('fs');
const path = require('path');

const extensions = {
    gallery: [],
    metadata: []
};

fs.readdirSync(path.join(__dirname, 'extensions')).forEach(file => {
    // directory of directories
    const dirPath = path.join(__dirname, 'extensions', file);
    if (fs.statSync(dirPath).isDirectory()) {
        // read the directory
        fs.readdirSync(dirPath).forEach(subFile => {
            // check if the file is a .js file
            if (subFile === "info.json") {
                const filePath = path.join(dirPath, subFile);
                // read the file and log its content
                try {
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (content.shown.gallery) {
                        extensions.gallery.push({
                            name: content.name,
                            description: content.description,
                            full: content,
                        });
                    }
                    if (content.shown['generated-metadata']) {
                        extensions.metadata.push({
                            name: content.name,
                            description: content.description,
                            full: content,
                            relativePath: path.relative(__dirname, path.dirname(filePath))
                        });
                    }
                } catch (error) {
                    console.error(`Error reading ${filePath}: ${error.message}`);
                }
            }
        });
    }
});

const outputDir = path.join(__dirname, 'generated-metadata');
if (!fs.existsSync(outputDir)) 
    fs.mkdirSync(outputDir, { recursive: true });

// Map to new format
const galleryOutput = extensions.metadata.map(ext => {
    const full = ext.full;
    // Determine the image path
    const coverPath = path.join(ext.relativePath, 'cover.png');
    const absoluteCoverPath = path.join(__dirname, coverPath);
    const image = fs.existsSync(absoluteCoverPath)
        ? coverPath
        : 'images/unknown.png';
    return {
        slug: (full.id || full.name || '').toLowerCase().replace(/\s+/g, '-'),
        id: full.id || full.name || '',
        name: full.name || '',
        description: full.description || '',
        shown: full.shown || {},
        codePath: path.join(ext.relativePath, 'script.js').replaceAll("\\","/"),
        image,
        by: (full.by || []).map(author => ({
            name: author.name || '',
            link: author.url || author.link || ''
        }))
    };
});

fs.writeFileSync(
    path.join(outputDir, 'extensions-v0.json'),
    JSON.stringify(galleryOutput, null, 2),
    'utf8'
);
