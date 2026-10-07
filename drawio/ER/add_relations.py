from pathlib import Path
import xml.etree.ElementTree as E

base = Path(__file__).parent
tree = E.parse(base / 'v3.drawio')
root = tree.find('./diagram/mxGraphModel/root')
prefix = 'z2s17M3an1eQyeOkQvxq-'
cells = {c.get('id'): c for c in root}
def old(n): return cells[prefix + str(n)]
def vertex(id, value, style, x, y, w, h, parent='1', relative=False):
    c = E.SubElement(root, 'mxCell', id=id, value=value, style=style, vertex='1', parent=parent)
    g = E.SubElement(c, 'mxGeometry', x=str(x), y=str(y), width=str(w), height=str(h), **{'as':'geometry'})
    if relative: g.set('relative', '1')
    return c
def edge(id, source, target):
    c = E.SubElement(root, 'mxCell', id=id, source=source, target=target, parent='1', edge='1', style='edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=none;startArrow=none;')
    E.SubElement(c, 'mxGeometry', relative='1', **{'as':'geometry'})
    return c
def mark(c, entity_at_source, cardinality, optional=False):
    sign = -1 if entity_at_source else 1
    label = vertex(c.get('id')+'-card', cardinality, 'text;html=0;align=center;verticalAlign=middle;fontSize=20;fontStyle=1;labelBackgroundColor=#ffffff;', sign*.80, -15, 28, 26, c.get('id'), True)
    E.SubElement(label.find('mxGeometry'), 'mxPoint', x='-14', y='-13', **{'as':'offset'})
    if optional:
        circle = vertex(c.get('id')+'-optional', '', 'ellipse;aspect=fixed;fillColor=#ffffff;strokeColor=#333333;strokeWidth=1.5;', sign*.42, 0, 13, 13, c.get('id'), True)
        E.SubElement(circle.find('mxGeometry'), 'mxPoint', x='-6.5', y='-6.5', **{'as':'offset'})

# Replace the existing split connector and hand-positioned labels.
old(940).set('target', prefix+'627')
for n in (742, 941, 939, 943, 922, 923): root.remove(old(n))

# Each tuple: edge, entity at source, maximum, optional minimum.
rules = [
 (515,True,'1',False),(614,False,'1',False),
 (647,True,'1',False),(654,True,'1',True),
 (648,True,'1',False),(664,True,'1',True),
 (649,True,'1',False),(678,True,'N',True),
 (745,True,'1',False),(679,True,'N',True),
 (736,True,'1',False),(705,True,'1',True),
 (744,True,'1',False),(940,False,'N',True),
 (817,True,'1',False),(746,True,'1',False),
 (820,False,'1',True),(821,False,'N',True),
 (824,False,'1',False),(823,False,'N',True),
 (826,False,'1',False),(827,False,'N',True),
 (831,False,'1',False),(830,False,'N',True),
 (899,True,'1',False),(920,False,'N',True),
 (578,True,'1',False),(924,False,'N',True),
 (934,False,'1',True),(935,False,'N',True),
]
for n, src, maximum, opt in rules: mark(old(n),src,maximum,opt)

# Three binary subtype relationships, with an exclusive/total constraint.
for n in (514,562,577,612,613): root.remove(old(n))
diamond = 'shape=rhombus;whiteSpace=wrap;html=0;fontSize=16;fillColor=#f5f5f5;strokeColor=#666666;'
for subtype,x in ((563,827),(579,1121),(568,1400)):
    rid = 'chen-subtype-'+str(subtype)
    vertex(rid,'er',diamond,x,690,159,49)
    a=edge(rid+'-user',prefix+'516',rid)
    a.set('style',a.get('style')+'exitX=0.75;exitY=1;entryX=0.5;entryY=0;')
    b=edge(rid+'-child',rid,prefix+str(subtype))
    b.set('style',b.get('style')+'exitX=0.5;exitY=1;entryX=0.5;entryY=0;')
    mark(a,True,'1')
    mark(b,False,'1',True)
old(735).set('value','resulterer i')
old(822).set('value','udløser')
old(936).set('value','udløser')
note_style='rounded=0;whiteSpace=wrap;html=0;fillColor=#fff2cc;strokeColor=#d6b656;align=left;spacing=12;fontSize=16;'
vertex('chen-legend','Notation: 1 / N angiver maksimum ved den pågældende entity. En cirkel på samme linjestykke sænker minimum til 0. Uden cirkel er minimum 1. Eksempel: User 1 — opretter — ○ N Task betyder, at en User kan oprette 0..N Tasks, og hver Task har præcis 1 User.',note_style,2700,380,530,150)
vertex('chen-task-rule','Constraint: Hver Task er præcis én af OrganizationTask og PeerTask (total og disjunkt specialisering). OrganizationTask oprettes af Organization; PeerTask oprettes af Peer.',note_style,2700,560,530,115)
vertex('chen-assumptions','Antagelser til afklaring:\n• Hver Peer får præcis én Account.\n• En Transaction kan have 0 LedgerEntries, mens den afventer behandling. En bogført Transaction skal have mindst én.\n• Transaction.contributor_id antages at referere til Contribution.id, som den eksisterende forbindelse viser. Hvis det er korrekt, bør feltet hedde contribution_id.\n• De to nullable oprindelser på Transaction fastlægger ikke i sig selv, om præcis én skal være udfyldt.',note_style,2700,720,530,280)
vertex('chen-contribution-rule','Constraint: Kun en accepteret Application kan resultere i en Contribution. application_id er UNIQUE: højst én Contribution pr. Application. N på Transaction-siden tillader flere posteringer, fx en senere korrektion; de nuværende FK-felter er ikke UNIQUE.',note_style,2700,1040,530,160)
tree.write(base/'v3-relations.drawio',encoding='utf-8',xml_declaration=True)
# Structural validation: unique IDs, all references resolve, all relationship edges labelled.
result=E.parse(base/'v3-relations.drawio').find('./diagram/mxGraphModel/root')
ids=[c.get('id') for c in result]
assert len(ids)==len(set(ids))
for c in result:
    for attr in ('parent','source','target'):
        if c.get(attr): assert c.get(attr) in ids,(c.get('id'),attr)
    if c.get('edge')=='1': assert c.get('id')+'-card' in ids,c.get('id')
print(f'Created v3-relations.drawio; validated {len(ids)} cells and {sum(c.get("edge")=="1" for c in result)} labelled edges.')
