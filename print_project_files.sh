#!/bin/bash

# Redirect all output to stdout.txt
exec > stdout.txt

tree -L 2
tree ./frontend/src/ -L 2

# Print startup and config files
echo "### File: start.sh"
cat start.sh
echo -e "\n\n"

echo "### File: environment.yaml"
cat environment.yaml
echo -e "\n\n"

# Print backend files
echo "### File: backend/app.py"
cat backend/app.py
echo -e "\n\n"

echo "### File: backend/requirements.txt"
cat backend/requirements.txt
echo -e "\n\n"

# Print frontend config and entry points
echo "### File: frontend/package.json"
cat frontend/package.json
echo -e "\n\n"

echo "### File: frontend/public/index.html"
cat frontend/public/index.html
echo -e "\n\n"

echo "### File: frontend/src/index.js"
cat frontend/src/index.js
echo -e "\n\n"

echo "### File: frontend/src/App.js"
cat frontend/src/App.js
echo -e "\n\n"

echo "### File: frontend/src/styles.css"
cat frontend/src/styles.css
echo -e "\n\n"

# Print frontend components (in alphabetical order for logic)
echo "### File: frontend/src/components/EducationPanel.js"
cat frontend/src/components/EducationPanel.js
echo -e "\n\n"

echo "### File: frontend/src/components/Explorer3D.js"
cat frontend/src/components/Explorer3D.js
echo -e "\n\n"

echo "### File: frontend/src/components/LocationInput.js"
cat frontend/src/components/LocationInput.js
echo -e "\n\n"

# Print docs
#echo "### File: README.md"
#cat README.md
#echo -e "\n\n"

#echo "### File: LICENSE"
#cat LICENSE
#echo -e "\n\n"
