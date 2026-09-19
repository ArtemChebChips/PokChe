"""Small river games, solved with HiGHS. Not a full Holdem strategy database.
Run after installing scripts/solver-requirements.txt into .tools/solver-python.
"""
from pathlib import Path
import sys,json,hashlib
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'.tools/solver-python'))
import numpy as np
import scipy
from scipy.optimize import linprog

# Attacker knows whether their hand is value or bluff. Defender has one bluff catcher.
# Pure attacker plans: check/check, check/bet, bet/check, bet/bet (value/bluff).
plans=[(0,0),(0,1),(1,0),(1,1)]
def solve(pot,bet,value_probability,tolerance):
    matrix=[]
    for vp,bp in plans:
        row=[]
        for call in [False,True]:
            v=pot if not vp or not call else pot+bet
            b=0 if not bp else (-bet if call else pot)
            row.append(value_probability*v+(1-value_probability)*b)
        matrix.append(row)
    a=np.asarray(matrix,float)
    # Maximise guaranteed attacker value, then minimise defender's worst-case loss.
    x=linprog([0,0,0,0,-1],A_ub=np.c_[-a.T,np.ones(2)],b_ub=np.zeros(2),A_eq=[[1,1,1,1,0]],b_eq=[1],bounds=[(0,None)]*4+[(None,None)],method='highs',options={'dual_feasibility_tolerance':tolerance,'primal_feasibility_tolerance':tolerance})
    y=linprog([0,0,1],A_ub=np.c_[a,-np.ones(4)],b_ub=np.zeros(4),A_eq=[[1,1,0]],b_eq=[1],bounds=[(0,None)]*2+[(None,None)],method='highs',options={'dual_feasibility_tolerance':tolerance,'primal_feasibility_tolerance':tolerance})
    assert x.success and y.success
    mix=x.x[:4];defender=y.x[:2]
    vbet=sum(mix[i]*p[0] for i,p in enumerate(plans));bbet=sum(mix[i]*p[1] for i,p in enumerate(plans));call=defender[1]
    gap=float(max(a@defender)-min(mix@a))
    expected_bluff=value_probability/(1-value_probability)*bet/(pot+bet)
    assert abs(vbet-1)<1e-7 and abs(bbet-expected_bluff)<1e-7
    assert abs(call-pot/(pot+bet))<1e-7 and gap<1e-7
    return dict(valueBet=float(vbet),bluffBet=float(bbet),defenderCall=float(call),gameValue=float(x.x[-1]),gap=gap,bluffEV=float((1-call)*pot-call*bet),valueEV=float((1-call)*pot+call*(pot+bet)))

inputs=[(100,25,.5),(100,50,.5),(100,75,.4),(100,100,.6),(100,150,.5)]
rows=[]
for i,(p,b,w) in enumerate(inputs):
    coarse=solve(p,b,w,1e-7);strict=solve(p,b,w,1e-9)
    assert max(abs(coarse[k]-strict[k]) for k in coarse)<1e-7
    rows.append(dict(id=f'river-{i+1}',pot=p,bet=b,valueWeight=w,board=['Qs','8h','3c','2d','9s'],valueHand=['As','Ah'],bluffHand=['Jh','6h'],defenderHand=['Kc','Kd'],**strict))
output=dict(version=1,model='Heads-up river; value always beats bluff catcher, bluff always loses; attacker check/bet, defender fold/call; no rake or raises; range is explicitly synthetic.',solver='SciPy '+scipy.__version__+' / HiGHS dual linear programs',scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),tolerances=[1e-7,1e-9],scenarios=rows)
path=root/'src/data/river-models.json';path.parent.mkdir(exist_ok=True);path.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Verified 5 river games: primal/dual gap < 1e-7, tighter solve stable, analytic frequencies match.')
