// Test script to verify AI generates proper Mermaid syntax
async function testMermaidGeneration() {
  const response = await fetch('http://localhost:3000/api/generate-mermaid', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Create a sequence diagram for learning AI/ML with participants like Education (Courses, Books), Tools (Python, Libraries), and Learner'
    })
  });

  const data = await response.json();
  console.log('Generated Mermaid Code:');
  console.log('========================');
  console.log(data.mermaidCode);
  console.log('========================');
  
  // Check if participant names with parentheses are properly quoted
  const hasProperQuotes = data.mermaidCode.includes('participant "');
  console.log('\n✅ Proper quotes found:', hasProperQuotes);
}

testMermaidGeneration();
