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
      const nodeCount = graphData.nodes.length;
      const edgeCount = graphData.edges.length;
      
      // File type color mapping
      const fileTypeColors = {
        'COBOL': 'fill:#00ff00,stroke:#00cc00,stroke-width:3px',
        'JCL': 'fill:#00ffff,stroke:#00cccc,stroke-width:3px',
        'DB2': 'fill:#ffff00,stroke:#cccc00,stroke-width:3px',
        'VSAM': 'fill:#ff00ff,stroke:#cc00cc,stroke-width:3px',
        'CICS': 'fill:#ff8800,stroke:#cc6600,stroke-width:3px',
        'COPYBOOK': 'fill:#00ff88,stroke:#00cc66,stroke-width:3px',
        'UNKNOWN': 'fill:#888888,stroke:#666666,stroke-width:3px'
      };

      // Use flowchart for better layout with many nodes
      let mermaidCode = 'flowchart TB\n';
      
      // Group nodes by file type for better organization
      const nodesByType = {};
      graphData.nodes.forEach(node => {
        const type = node.fileType || 'UNKNOWN';
        if (!nodesByType[type]) nodesByType[type] = [];
        nodesByType[type].push(node);
      });
      
      // Add subgraphs for each file type (creates visual clustering)
      Object.keys(nodesByType).forEach(fileType => {
        const nodes = nodesByType[fileType];
        if (nodes.length > 0) {
          mermaidCode += `    subgraph ${fileType}["${fileType} (${nodes.length})"]\n`;
          
          nodes.forEach(node => {
            const nodeId = `N${node.id}`;
            const label = node.label.replace(/\.[a-z]+$/i, ''); // Remove extension
            
            // Icon based on file type
            const icon = fileType === 'JCL' ? '⚙️' :
                         fileType === 'DB2' ? '🗄️' :
                         fileType === 'VSAM' ? '📁' :
                         fileType === 'CICS' ? '🖥️' :
                         fileType === 'COPYBOOK' ? '📋' :
                         fileType === 'COBOL' ? '📦' :
                         '❓';
            
            // Complexity indicator
            const complexity = node.complexity || 0;
            const complexityBadge = complexity > 50 ? '🔴' :
                                   complexity > 20 ? '🟡' :
                                   '🟢';
            
            // Create rich node label
            mermaidCode += `        ${nodeId}["${icon} ${label}<br/>${complexityBadge} C:${complexity}"]\n`;
            
            // Apply styling based on file type
            const nodeColor = fileTypeColors[fileType] || fileTypeColors['UNKNOWN'];
            mermaidCode += `        style ${nodeId} ${nodeColor},color:#000\n`;
          });
          
          mermaidCode += `    end\n`;
        }
      });
      
      // Add edges with descriptive labels
      graphData.edges.forEach(edge => {
        const fromId = `N${edge.from}`;
        const toId = `N${edge.to}`;
        const fromNode = graphData.nodes.find(n => n.id === edge.from);
        const toNode = graphData.nodes.find(n => n.id === edge.to);
        
        if (!fromNode || !toNode) return; // Skip invalid edges
        
        const edgeType = edge.type || 'CALLS';
        const isCrossLanguage = fromNode.fileType !== toNode.fileType;
        
        // Different arrow styles for different edge types
        if (edgeType === 'INCLUDES') {
          mermaidCode += `    ${fromId} -.->|"${edgeType}"| ${toId}\n`;
        } else if (isCrossLanguage) {
          mermaidCode += `    ${fromId} ==>|"${edgeType}"| ${toId}\n`;
        } else {
          mermaidCode += `    ${fromId} -->|"${edgeType}"| ${toId}\n`;
        }
      });

      // Add click handlers for nodes (Mermaid supports this)
      graphData.nodes.forEach(node => {
        mermaidCode += `    click N${node.id} call handleNodeClick(${node.id})\n`;
      });

      console.log('Rendering Mermaid with', nodeCount, 'nodes and', edgeCount, 'edges');
      
      // Render the diagram
      const { svg } = await mermaid.render('mermaid-graph', mermaidCode);
      mermaidRef.current.innerHTML = svg;
      
      // Add zoom/pan functionality
      addZoomPan(mermaidRef.current);
      
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      mermaidRef.current.innerHTML = `
        <div style="color: var(--error-red); padding: 2rem; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
          <div style="font-weight: bold; margin-bottom: 0.5rem;">Failed to render diagram</div>
          <div style="color: var(--mainframe-border); font-size: 0.85rem;">${error.message}</div>
          <div style="margin-top: 1rem; color: var(--mainframe-border); font-size: 0.85rem;">
            Try the "NODE LIST" or "JSON DATA" tabs to view graph data
          </div>
        </div>
      `;
    }
  };

  // Add zoom and pan functionality to SVG
  const addZoomPan = (container) => {
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    let scale = 1;
    let panning = false;
    let pointX = 0;
    let pointY = 0;
    let start = { x: 0, y: 0 };
    
    svg.style.cursor = 'grab';
    
    // Mouse wheel zoom
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      scale *= delta;
      scale = Math.min(Math.max(scale, 0.1), 5); // Limit zoom
      svg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    });
    
    // Mouse drag pan
    svg.addEventListener('mousedown', (e) => {
      panning = true;
      start = { x: e.clientX - pointX, y: e.clientY - pointY };
      svg.style.cursor = 'grabbing';
    });
    
    svg.addEventListener('mousemove', (e) => {
      if (!panning) return;
      pointX = e.clientX - start.x;
      pointY = e.clientY - start.y;
      svg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    });
    
    svg.addEventListener('mouseup', () => {
      panning = false;
      svg.style.cursor = 'grab';
    });
    
    svg.addEventListener('mouseleave', () => {
      panning = false;
      svg.style.cursor = 'grab';
    });
  };

  const copyJsonToClipboard = () => {
    if (!graphData || !graphData.nodes) {
      console.error('No graph data available to copy');
      return;
    }
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
                {/* Statistics Panel */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ 
                    background: 'var(--mainframe-dark)', 
                    padding: '1rem', 
                    borderLeft: '4px solid var(--success-green)' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mainframe-border)', marginBottom: '0.3rem' }}>
                      TOTAL NODES
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success-green)' }}>
                      {graphData.nodes.length}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'var(--mainframe-dark)', 
                    padding: '1rem', 
                    borderLeft: '4px solid var(--info-blue)' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mainframe-border)', marginBottom: '0.3rem' }}>
                      TOTAL EDGES
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--info-blue)' }}>
                      {graphData.edges.length}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'var(--mainframe-dark)', 
                    padding: '1rem', 
                    borderLeft: '4px solid var(--warning-amber)' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mainframe-border)', marginBottom: '0.3rem' }}>
                      AVG COMPLEXITY
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--warning-amber)' }}>
                      {Math.round(graphData.nodes.reduce((sum, n) => sum + (n.complexity || 0), 0) / graphData.nodes.length)}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'var(--mainframe-dark)', 
                    padding: '1rem', 
                    borderLeft: '4px solid var(--modern-blue)' 
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mainframe-border)', marginBottom: '0.3rem' }}>
                      FILE TYPES
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--modern-blue)' }}>
                      {new Set(graphData.nodes.map(n => n.fileType || 'UNKNOWN')).size}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ 
                  background: 'var(--mainframe-dark)', 
                  padding: '1rem', 
                  marginBottom: '1rem',
                  borderLeft: '3px solid var(--modern-blue)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.7rem', color: 'var(--modern-blue)' }}>
                    📊 LEGEND
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div><span style={{ color: '#00ff00' }}>🟢</span> Simple (0-20)</div>
                    <div><span style={{ color: '#ffaa00' }}>🟡</span> Moderate (21-50)</div>
                    <div><span style={{ color: '#ff4444' }}>🔴</span> Complex (51+)</div>
                    <div><span style={{ color: '#00ff00' }}>📦</span> COBOL</div>
                    <div><span style={{ color: '#00ffff' }}>⚙️</span> JCL</div>
                    <div><span style={{ color: '#ffff00' }}>🗄️</span> DB2</div>
                    <div><span style={{ color: '#ff00ff' }}>📁</span> VSAM</div>
                    <div><span style={{ color: '#ff8800' }}>🖥️</span> CICS</div>
                    <div><span style={{ color: '#00ff88' }}>📋</span> COPYBOOK</div>
                  </div>
                  <div style={{ marginTop: '0.7rem', fontSize: '0.75rem', color: 'var(--mainframe-border)' }}>
                    Arrow Types: → (same type) | ⇒ (cross-type) | ⋯→ (includes)
                  </div>
                </div>

                <div className="panel-header" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  INTERACTIVE GRAPH VISUALIZATION
                </div>
                <div 
                  ref={mermaidRef}
                  style={{ 
                    background: '#000',
                    padding: '2rem',
                    borderRadius: '4px',
                    border: '2px solid var(--mainframe-border)',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: '800px',
                    minHeight: '600px',
                    position: 'relative'
                  }}
                >
                  {/* Mermaid diagram renders here */}
                </div>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: 'var(--mainframe-dark)', 
                  fontSize: '0.85rem',
                  color: 'var(--success-green)',
                  borderLeft: '3px solid var(--success-green)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🖱️ INTERACTIVE CONTROLS:</div>
                  <div style={{ color: 'var(--mainframe-border)', lineHeight: '1.8' }}>
                    • <strong>Mouse Wheel:</strong> Zoom in/out<br/>
                    • <strong>Click + Drag:</strong> Pan around the graph<br/>
                    • <strong>Scroll:</strong> Navigate large graphs<br/>
                    • <strong>Grouped by File Type:</strong> Each cluster represents a different mainframe language
                  </div>
                </div>
              </div>
            )}

            {/* NODES TAB - Detailed Node List with Hover Tooltips */}
            {activeTab === 'nodes' && (
              <div>
                <div className="panel-header" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  ALL NODES ({graphData.nodes.length}) - GROUPED BY FILE TYPE
                </div>
                
                {/* Group nodes by file type */}
                {(() => {
                  const nodesByType = {};
                  graphData.nodes.forEach(node => {
                    const type = node.fileType || 'UNKNOWN';
                    if (!nodesByType[type]) nodesByType[type] = [];
                    nodesByType[type].push(node);
                  });
                  
                  return Object.keys(nodesByType).sort().map(fileType => (
                    <div key={fileType} style={{ marginBottom: '1.5rem' }}>
                      {/* File Type Header */}
                      <div style={{ 
                        background: 'var(--mainframe-dark)', 
                        padding: '0.7rem 1rem', 
                        marginBottom: '0.5rem',
                        borderLeft: '4px solid var(--success-green)',
                        fontWeight: 'bold',
                        fontSize: '0.95rem'
                      }}>
                        {fileType === 'COBOL' && '📦'} 
                        {fileType === 'JCL' && '⚙️'} 
                        {fileType === 'DB2' && '🗄️'} 
                        {fileType === 'VSAM' && '📁'} 
                        {fileType === 'CICS' && '🖥️'} 
                        {fileType === 'COPYBOOK' && '📋'} 
                        {fileType === 'UNKNOWN' && '❓'} 
                        {' '}{fileType} ({nodesByType[fileType].length} files)
                      </div>
                      
                      {/* Nodes of this type */}
                      {nodesByType[fileType].map((node) => (
                        <div 
                          key={node.id} 
                          style={{ 
                            background: 'var(--mainframe-dark)', 
                            padding: '0.8rem', 
                            marginBottom: '0.5rem',
                            marginLeft: '1rem',
                            borderLeft: '3px solid var(--info-blue)',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            setHoveredNode(node);
                            e.currentTarget.style.borderLeft = '3px solid var(--success-green)';
                            e.currentTarget.style.background = 'rgba(0, 255, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            setHoveredNode(null);
                            e.currentTarget.style.borderLeft = '3px solid var(--info-blue)';
                            e.currentTarget.style.background = 'var(--mainframe-dark)';
                          }}
                        >
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ color: 'var(--mainframe-green)', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                                {node.label}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--mainframe-border)' }}>
                                ID: {node.id} | Type: {node.type} | Complexity: {node.complexity || 0}
                              </div>
                              {node.metadata && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--mainframe-border)', marginTop: '0.3rem' }}>
                                  Depth: {node.metadata.logic_depth || 0} | 
                                  Variables: {node.metadata.variable_count || 0} | 
                                  Decisions: {node.metadata.decision_points || 0}
                                </div>
                              )}
                            </div>
                            <div style={{ 
                              padding: '0.3rem 0.6rem', 
                              background: node.complexity > 50 ? 'var(--error-red)' : 
                                         node.complexity > 20 ? 'var(--warning-amber)' : 
                                         'var(--success-green)',
                              color: '#000',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {node.complexity > 50 ? '🔴' : node.complexity > 20 ? '🟡' : '🟢'} {node.complexity}
                            </div>
                          </div>
                          
                          {/* Tooltip with full JSON on hover */}
                          {hoveredNode && hoveredNode.id === node.id && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              zIndex: 1000,
                              background: '#000',
                              border: '2px solid var(--success-green)',
                              padding: '1rem',
                              borderRadius: '4px',
                              minWidth: '400px',
                              maxWidth: '600px',
                              marginTop: '0.5rem',
                              boxShadow: '0 4px 6px rgba(0,255,0,0.3)',
                              overflowX: 'auto'
                            }}>
                              <div style={{ 
                                color: 'var(--success-green)', 
                                fontWeight: 'bold', 
                                marginBottom: '0.5rem',
                                fontSize: '0.85rem'
                              }}>
                                📋 FULL NODE DATA
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
                    </div>
                  ));
                })()}
                
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
