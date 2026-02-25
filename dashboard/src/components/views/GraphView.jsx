import React, { useState, useEffect, useRef } from 'react';
import FileUploader from '../FileUploader';
import mermaid from 'mermaid';

const GraphView = ({ loadedModules, setLoadedModules, graphData, setGraphData }) => {
  const [showUploader, setShowUploader] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual', 'nodes', 'json'
  const [hoveredNode, setHoveredNode] = useState(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const mermaidRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#00ff00',
        primaryTextColor: '#00ff00',
        primaryBorderColor: '#00ff00',
        lineColor: '#00ffff',
        secondaryColor: '#00ffff',
        tertiaryColor: '#333',
        background: '#000',
        mainBkg: '#1a1a1a',
        nodeBorder: '#00ff00',
        clusterBkg: '#1a1a1a',
        clusterBorder: '#00ff00',
        titleColor: '#00ff00',
        edgeLabelBackground: '#000',
        fontFamily: '"Courier New", monospace'
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'visual' && graphData && graphData.nodes.length > 0 && mermaidRef.current) {
      renderMermaidDiagram();
    }
  }, [activeTab, graphData]);

  const handleFilesUploaded = (results) => {
    const successful = results.filter(r => r.success);
    setLoadedModules(prev => [...prev, ...successful]);
    if (successful.length > 0) {
      setShowUploader(false);
      fetchGraphData(); // Fetch graph data after files are uploaded
    }
  };

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/graph');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGraphData(data.graph);
        if (data.graph.nodes.length === 0) {
          setError('No graph data available. Upload COBOL files to generate the knowledge graph.');
        }
      } else {
        // Handle error response from backend
        setError(data.message || 'Failed to load graph data from server.');
        setGraphData({ nodes: [], edges: [] });
      }
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
      setError(`Graph API Error: ${error.message}. Make sure Bridge service is running.`);
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setLoading(false);
    }
  };

  const renderMermaidDiagram = async () => {
    if (!mermaidRef.current || !graphData || graphData.nodes.length === 0) return;

    try {
      // File type color mapping
      const fileTypeColors = {
        'COBOL': 'fill:#00ff00,stroke:#00cc00',
        'JCL': 'fill:#00ffff,stroke:#00cccc',
        'DB2': 'fill:#ffff00,stroke:#cccc00',
        'VSAM': 'fill:#ff00ff,stroke:#cc00cc',
        'CICS': 'fill:#ff8800,stroke:#cc6600',
        'COPYBOOK': 'fill:#00ff88,stroke:#00cc66'
      };

      // Generate Mermaid syntax from graph data
      let mermaidCode = 'graph LR\n';
      
      // Add nodes with styling based on file type AND complexity
      graphData.nodes.forEach(node => {
        const nodeId = `N${node.id}`;
        const label = node.label.replace(/\.[a-z]+$/i, ''); // Remove file extension
        
        // Determine color based on file type (if available) or fallback to complexity
        let nodeColor;
        if (node.fileType && fileTypeColors[node.fileType]) {
          nodeColor = fileTypeColors[node.fileType];
        } else {
          // Fallback to complexity-based coloring
          nodeColor = node.complexity > 50 ? 'fill:#ff4444,stroke:#ff0000' :
                      node.complexity > 20 ? 'fill:#ffaa00,stroke:#ff8800' :
                      'fill:#00ff00,stroke:#00cc00';
        }
        
        const icon = node.fileType === 'JCL' ? '⚙️' :
                     node.fileType === 'DB2' ? '🗄️' :
                     node.fileType === 'VSAM' ? '📁' :
                     node.fileType === 'CICS' ? '🖥️' :
                     node.fileType === 'COPYBOOK' ? '📋' :
                     '📦'; // Default COBOL icon
        
        mermaidCode += `    ${nodeId}["${icon} ${label}<br/>`;
        if (node.fileType) mermaidCode += `Type: ${node.fileType}<br/>`;
        mermaidCode += `Complexity: ${node.complexity || 0}"]:::node${node.id}\n`;
        mermaidCode += `    style ${nodeId} ${nodeColor},color:#000\n`;
      });
      
      // Add edges with color based on cross-language relationships
      graphData.edges.forEach(edge => {
        const fromId = `N${edge.from}`;
        const toId = `N${edge.to}`;
        const fromNode = graphData.nodes.find(n => n.id === edge.from);
        const toNode = graphData.nodes.find(n => n.id === edge.to);
        
        // Cross-language edges get special styling
        const edgeType = edge.type || 'CALLS';
        const isCrossLanguage = fromNode?.fileType && toNode?.fileType && 
                                fromNode.fileType !== toNode.fileType;
        
        if (isCrossLanguage) {
          mermaidCode += `    ${fromId} -.->|"${edgeType} (${toNode.fileType})"| ${toId}\n`;
        } else {
          mermaidCode += `    ${fromId} -->|${edgeType}| ${toId}\n`;
        }
      });

      // Render the diagram
      const { svg } = await mermaid.render('mermaid-graph', mermaidCode);
      mermaidRef.current.innerHTML = svg;
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      mermaidRef.current.innerHTML = `<div style="color: var(--warning-amber); padding: 1rem;">Failed to render diagram: ${error.message}</div>`;
    }
  };

  const copyJsonToClipboard = () => {
    const jsonString = JSON.stringify({ nodes: graphData.nodes, edges: graphData.edges }, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  useEffect(() => {
    // Fetch graph data on mount if there are analyzed modules
    fetchGraphData();
  }, []);

  return (
    <div>
      <div className="panel-header">═══ KNOWLEDGE GRAPH VISUALIZATION ═══</div>
      
      <div style={{ background: 'var(--mainframe-dark)', padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid var(--modern-blue)' }}>
        <strong style={{ color: 'var(--modern-blue)' }}>ℹ INFO:</strong> Interactive knowledge graph with Mermaid diagrams, complete JSON data, and node details.
      </div>

      {showUploader ? (
        <>
          <FileUploader onFilesUploaded={handleFilesUploaded} />
          
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--mainframe-dark)' }}>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--modern-blue)' }}>
              💡 Quick Start:
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              • Upload COBOL files from <code>src/cobol/bank/</code> folder<br/>
              • Or drag & drop multiple .cob files<br/>
              • System will analyze dependencies automatically<br/>
              • Switch tabs to see Visual Graph, Node List, or JSON Data
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => setShowUploader(true)}
            className="submit-button"
            style={{ marginBottom: '1rem' }}
          >
            📁 LOAD MORE FILES
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--mainframe-dark)', padding: '1rem', marginBottom: '1rem', borderLeft: '3px solid var(--warning-amber)' }}>
          <strong style={{ color: 'var(--warning-amber)' }}>⚠ WARNING:</strong> {error}
        </div>
      )}

      {/* Refresh Button */}
      {!showUploader && (
        <button 
          onClick={fetchGraphData}
          disabled={loading}
          className="submit-button"
          style={{ 
            marginBottom: '1rem',
            background: loading ? 'var(--mainframe-border)' : 'var(--modern-blue)'
          }}
        >
          {loading ? '⏳ LOADING...' : '🔄 REFRESH GRAPH'}
        </button>
      )}

      {/* Tab Navigation */}
      {graphData && graphData.nodes.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--mainframe-border)' }}>
          <button 
            onClick={() => setActiveTab('visual')}
            style={{
              padding: '0.7rem 1.5rem',
              background: activeTab === 'visual' ? 'var(--modern-blue)' : 'var(--mainframe-dark)',
              color: activeTab === 'visual' ? '#000' : 'var(--mainframe-green)',
              border: 'none',
              borderBottom: activeTab === 'visual' ? '3px solid var(--mainframe-green)' : 'none',
              cursor: 'pointer',
              fontFamily: '"Courier New", monospace',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            📊 VISUAL GRAPH
          </button>
          <button 
            onClick={() => setActiveTab('nodes')}
            style={{
              padding: '0.7rem 1.5rem',
              background: activeTab === 'nodes' ? 'var(--modern-blue)' : 'var(--mainframe-dark)',
              color: activeTab === 'nodes' ? '#000' : 'var(--mainframe-green)',
              border: 'none',
              borderBottom: activeTab === 'nodes' ? '3px solid var(--mainframe-green)' : 'none',
              cursor: 'pointer',
              fontFamily: '"Courier New", monospace',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            📦 NODE LIST
          </button>
          <button 
            onClick={() => setActiveTab('json')}
            style={{
              padding: '0.7rem 1.5rem',
              background: activeTab === 'json' ? 'var(--modern-blue)' : 'var(--mainframe-dark)',
              color: activeTab === 'json' ? '#000' : 'var(--mainframe-green)',
              border: 'none',
              borderBottom: activeTab === 'json' ? '3px solid var(--mainframe-green)' : 'none',
              cursor: 'pointer',
              fontFamily: '"Courier New", monospace',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            📝 JSON DATA
          </button>
        </div>
      )}

      <div className="graph-container">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <div>Loading graph data...</div>
          </div>
        ) : graphData && graphData.nodes.length > 0 ? (
          <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
            
            {/* VISUAL TAB - Mermaid Diagram */}
            {activeTab === 'visual' && (
              <div>
                <div className="panel-header" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  MERMAID GRAPH VISUALIZATION
                </div>
                <div 
                  ref={mermaidRef}
                  style={{ 
                    background: '#000',
                    padding: '2rem',
                    borderRadius: '4px',
                    border: '1px solid var(--mainframe-border)',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: '600px'
                  }}
                >
                  {/* Mermaid diagram renders here */}
                </div>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.7rem', 
                  background: 'var(--mainframe-dark)', 
                  fontSize: '0.8rem',
                  color: 'var(--mainframe-border)',
                  borderLeft: '3px solid var(--modern-blue)'
                }}>
                  💡 Tip: Scroll horizontally/vertically to see the full graph. Color coding: 
                  <span style={{ color: '#00ff00', marginLeft: '0.5rem' }}>Green = Simple (≤20)</span>
                  <span style={{ color: '#ffaa00', marginLeft: '0.5rem' }}>Amber = Moderate (21-50)</span>
                  <span style={{ color: '#ff4444', marginLeft: '0.5rem' }}>Red = Complex (&gt;50)</span>
                </div>
              </div>
            )}

            {/* NODES TAB - Detailed Node List with Hover Tooltips */}
            {activeTab === 'nodes' && (
              <div>
                <div className="panel-header" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  GRAPH NODES ({graphData.nodes.length})
                </div>
                {graphData.nodes.map((node) => (
                  <div 
                    key={node.id} 
                    style={{ 
                      background: 'var(--mainframe-dark)', 
                      padding: '0.8rem', 
                      marginBottom: '0.5rem',
                      borderLeft: '3px solid var(--modern-blue)',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <div style={{ color: 'var(--mainframe-green)', fontWeight: 'bold' }}>
                      📦 {node.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--mainframe-border)', marginTop: '0.3rem' }}>
                      Type: {node.type} | Complexity: {node.complexity || 0} | ID: {node.id}
                    </div>
                    
                    {/* Tooltip with full JSON on hover */}
                    {hoveredNode && hoveredNode.id === node.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        zIndex: 1000,
                        background: '#000',
                        border: '2px solid var(--modern-blue)',
                        padding: '1rem',
                        borderRadius: '4px',
                        minWidth: '400px',
                        maxWidth: '600px',
                        marginTop: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                        overflowX: 'auto'
                      }}>
                        <div style={{ 
                          color: 'var(--modern-blue)', 
                          fontWeight: 'bold', 
                          marginBottom: '0.5rem',
                          fontSize: '0.85rem'
                        }}>
                          📋 NODE JSON DATA
                        </div>
                        <pre style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--mainframe-green)',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {JSON.stringify(node, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                {graphData.edges.length > 0 && (
                  <>
                    <div className="panel-header" style={{ fontSize: '0.9rem', marginTop: '1rem', marginBottom: '1rem' }}>
                      DEPENDENCIES ({graphData.edges.length})
                    </div>
                    {graphData.edges.map((edge, idx) => (
                      <div key={idx} style={{ 
                        padding: '0.5rem 1rem',
                        marginBottom: '0.3rem',
                        fontSize: '0.85rem',
                        color: 'var(--modern-blue)',
                        background: 'var(--mainframe-dark)'
                      }}>
                        {graphData.nodes[edge.from]?.label || `Node ${edge.from}`} 
                        <span style={{ margin: '0 0.5rem', color: 'var(--warning-amber)' }}>→</span> 
                        {graphData.nodes[edge.to]?.label || `Node ${edge.to}`}
                        <span style={{ marginLeft: '1rem', color: 'var(--mainframe-border)', fontSize: '0.8rem' }}>({edge.type})</span>
                      </div>
                    ))}
                  </>
                )}
                
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.7rem', 
                  background: 'var(--mainframe-dark)', 
                  fontSize: '0.8rem',
                  color: 'var(--mainframe-border)',
                  borderLeft: '3px solid var(--modern-blue)'
                }}>
                  💡 Tip: Hover over any node to see complete JSON data with all properties
                </div>
              </div>
            )}

            {/* JSON TAB - Complete JSON with Horizontal Scroll and Copy */}
            {activeTab === 'json' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="panel-header" style={{ fontSize: '0.9rem', margin: 0 }}>
                    COMPLETE JSON DATA
                  </div>
                  <button
                    onClick={copyJsonToClipboard}
                    style={{
                      padding: '0.5rem 1rem',
                      background: jsonCopied ? 'var(--mainframe-green)' : 'var(--modern-blue)',
                      color: '#000',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: '"Courier New", monospace',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      borderRadius: '3px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {jsonCopied ? '✓ COPIED!' : '📋 COPY JSON'}
                  </button>
                </div>
                
                <div style={{ 
                  background: '#000',
                  border: '2px solid var(--mainframe-border)',
                  borderRadius: '4px',
                  padding: '1rem',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: '600px'
                }}>
                  <pre style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--mainframe-green)',
                    margin: 0,
                    fontFamily: '"Courier New", monospace',
                    whiteSpace: 'pre',
                    lineHeight: '1.5'
                  }}>
                    {JSON.stringify({ 
                      graph: {
                        nodes: graphData.nodes,
                        edges: graphData.edges,
                        nodeCount: graphData.nodes.length,
                        edgeCount: graphData.edges.length
                      }
                    }, null, 2)}
                  </pre>
                </div>
                
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.7rem', 
                  background: 'var(--mainframe-dark)', 
                  fontSize: '0.8rem',
                  color: 'var(--mainframe-border)',
                  borderLeft: '3px solid var(--modern-blue)'
                }}>
                  💡 Tip: This JSON can be used for API integration, data export, or custom visualizations. Scroll horizontally for long lines.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--mainframe-border)' }}>
            <div style={{ fontSize: '3rem' }}>🕸️</div>
            <div style={{ fontSize: '1.2rem' }}>KNOWLEDGE GRAPH</div>
            <div style={{ fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
              Real-time visualization of program dependencies, data flows, and system relationships.
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--modern-blue)' }}>
              {loadedModules.length > 0 ? '✓ Upload more files or analyze existing modules' : 'Upload COBOL files above to generate graph visualization'}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div className="panel-header" style={{ fontSize: '0.9rem' }}>GRAPH STATISTICS</div>
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-label">ANALYZED MODULES</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>{loadedModules.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">GRAPH NODES</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>{graphData?.nodes?.length || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">DEPENDENCIES</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>{graphData?.edges?.length || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">AVG COMPLEXITY</div>
            <div className="metric-value" style={{ fontSize: '1.5rem' }}>
              {graphData?.nodes?.length > 0 
                ? Math.round(graphData.nodes.reduce((sum, n) => sum + (n.complexity || 0), 0) / graphData.nodes.length)
                : 0}
            </div>
          </div>
        </div>
      </div>

      {loadedModules.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div className="panel-header" style={{ fontSize: '0.9rem' }}>LOADED MODULES</div>
          <div style={{ 
            background: 'var(--mainframe-dark)', 
            padding: '1rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {loadedModules.map((module, idx) => (
              <div key={idx} style={{ 
                padding: '0.3rem 0',
                borderBottom: idx < loadedModules.length - 1 ? '1px solid var(--mainframe-border)' : 'none'
              }}>
                <span style={{ color: 'var(--mainframe-green)' }}>✓ {module.name}</span>
                {module.data?.metadata && (
                  <span style={{ color: 'var(--mainframe-border)', fontSize: '0.85rem', marginLeft: '1rem' }}>
                    Complexity: {module.data.metadata.cyclomatic_complexity || 0}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphView;
