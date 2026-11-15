#!/usr/bin/env python3
"""BQ-EVAL-01-CI-01 RECOVERY v1. GET-only GitHub collection; offline calculation.
No application commands, workflow dispatches, credentials or billing APIs.
"""
import argparse, csv, datetime as dt, hashlib, json, pathlib, urllib.request
from concurrent.futures import ThreadPoolExecutor

REPO = 'pahlborn/bis-school-app_src'
API = 'https://api.github.com/repos/' + REPO
START, END = '2026-11-10T23:00:00Z', '2026-11-14T23:00:00Z'
ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / 'snapshot'

def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def get(url):
    req = urllib.request.Request(url, headers={'Accept':'application/vnd.github+json', 'User-Agent':'CI-01-read-only-recovery'})
    with urllib.request.urlopen(req, timeout=60) as r:
        obj = json.load(r)
    return obj

def pick(obj, keys):
    return {k: obj.get(k) for k in keys.split()}

def associate(r, prs):
    numbers = list(r['pr_numbers'])
    evidence = 'run.pull_requests'
    for p in prs:
        if p['number'] not in numbers and r['head_branch']==p['head_ref'] and r['head_sha'] in p['commit_shas']:
            numbers.append(p['number']);evidence='PR head_ref plus exact commit SHA membership; run.pull_requests empty'
    return numbers, evidence

RUNKEYS = 'id name workflow_id path event head_branch head_sha run_number run_attempt status conclusion created_at updated_at run_started_at html_url check_suite_id'
JOBKEYS = 'id run_id run_attempt name head_sha status conclusion started_at completed_at html_url runner_id runner_name runner_group_id runner_group_name labels'

def collect():
    DATA.mkdir(exist_ok=True)
    runs, sources = {}, []
    prs=[]
    for number in (193,198):
        url=API+'/pulls/'+str(number)
        p=get(url);shas=[];page=1
        sources.append({'url':url,'kind':'PR-metadata'})
        while True:
            cu=url+'/commits?per_page=100&page='+str(page)
            commits=get(cu);shas.extend(c['sha'] for c in commits)
            sources.append({'url':cu,'kind':'PR-commit-membership','records':len(commits)})
            if len(commits)<100:break
            page+=1
        prs.append({'number':number,'head_ref':p['head']['ref'],'head_sha':p['head']['sha'],'base_ref':p['base']['ref'],'commit_shas':shas,'source':url})
    write(DATA/'pulls.json',prs)
    page = 1
    while True:
        url = API + '/actions/runs?per_page=100&created=2026-11-10T23:00:00Z..2026-11-14T22:59:59Z&page=' + str(page)
        obj = get(url)
        rows = []
        for r in obj['workflow_runs']:
            n = pick(r, RUNKEYS)
            n['pr_numbers'] = [p['number'] for p in r.get('pull_requests', [])]
            rows.append(n)
            numbers,evidence=associate(n,prs)
            if START <= r['created_at'] < END and set(numbers) & {193,198}:
                runs[r['id']] = dict(n,pr_numbers=numbers,pr_association=evidence)
        write(DATA / ('runs-page-%02d.json' % page), {'source':url, 'total_count':obj['total_count'], 'runs':rows})
        sources.append({'url':url,'records':len(rows),'kind':'runs-page'})
        if len(rows) < 100: break
        page += 1

    def attempt(args):
        run, number = args
        url = API + '/actions/runs/%s/attempts/%s' % (run['id'],number)
        target=DATA / ('attempt-%s-%s.json' % (run['id'],number))
        if target.exists():
            saved=json.loads(target.read_text());saved['pr_numbers']=run['pr_numbers'];write(target,saved)
            return [{'url':url,'kind':'attempt'},{'url':url+'/jobs?per_page=100&page=1','records':len(saved['jobs']),'kind':'jobs-page'}]
        meta = get(url)
        jobs, pages = {}, []
        p = 1
        while True:
            ju = url + '/jobs?per_page=100&page=' + str(p)
            jo = get(ju)
            pages.append({'url':ju,'records':len(jo['jobs']),'kind':'jobs-page'})
            for j in jo['jobs']:
                n = pick(j, JOBKEYS)
                n['steps'] = [pick(s,'name number status conclusion started_at completed_at') for s in j.get('steps',[])]
                jobs[j['id']] = n
            if len(jo['jobs']) < 100: break
            p += 1
        result = {'source':url,'run':pick(meta,RUNKEYS),'pr_numbers':run['pr_numbers'],'jobs':list(jobs.values())}
        write(DATA / ('attempt-%s-%s.json' % (run['id'],number)),result)
        return [{'url':url,'kind':'attempt'}] + pages

    work = [(r,a) for r in runs.values() for a in range(1,r['run_attempt']+1)]
    with ThreadPoolExecutor(max_workers=5) as pool:
        for items in pool.map(attempt,work): sources.extend(items)
    # Exact workflow content at every observed head SHA. Store no actor/person fields.
    pairs = sorted({(r['path'].split('@')[0],r['head_sha']) for r in runs.values()})
    def workflow(pair):
        import base64
        path,sha = pair
        url = API + '/contents/' + path + '?ref=' + sha
        obj = get(url)
        content = base64.b64decode(obj['content']).decode('utf-8')
        filename = sha + '-' + pathlib.Path(path).name
        out = DATA / 'workflows' / filename
        out.parent.mkdir(exist_ok=True)
        out.write_text(content,encoding='utf-8')
        return {'url':url,'kind':'workflow-version','path':path,'head_sha':sha,'git_blob_sha':obj['sha'],'file':'snapshot/workflows/'+filename}
    with ThreadPoolExecutor(max_workers=5) as pool:
        sources.extend(pool.map(workflow,pairs))
    write(DATA / 'sources.json', sorted(sources,key=lambda x:x['url']))
    write(DATA / 'collection.json', {'label':'RECONSTRUCTION / Rekonstruktion, not recovered originals','collected_at':dt.datetime.now(dt.timezone.utc).isoformat(),'repository':REPO,'start_inclusive':START,'end_exclusive':END,'timezone':'Europe/Berlin (UTC+01:00)','selection':'run.created_at in interval AND explicit PR association or exact PR head branch plus commit membership; all attempts of selected runs','pages':page,'listed_runs':sum(len(json.loads(p.read_text())['runs']) for p in DATA.glob('runs-page-*.json')),'selected_runs':len(runs),'selected_attempts':len(work),'runner_and_steps':'API observations; runner names/labels not billing SKU evidence','privacy':'Normalized allowlist, no actors, email, credentials, private addresses or billing values'})

def context():
    """Bounded evidence for the three existing suggestions, plus refusal annotations."""
    sources=json.loads((DATA/'sources.json').read_text())
    runs={r['id']:r for p in DATA.glob('runs-page-*') for r in json.loads(p.read_text())['runs']}
    out=[]
    for p in sorted(DATA.glob('attempt-*')):
        a=json.loads(p.read_text())
        if not any(not j['steps'] for j in a['jobs']):continue
        rid=a['run']['id'];sid=runs[rid]['check_suite_id']
        u=API+f'/check-suites/{sid}/check-runs?per_page=100'
        obj=get(u);checks=[]
        sources.append({'url':u,'kind':'check-runs-current-suite','records':len(obj['check_runs'])})
        if len(obj['check_runs'])>=100:raise RuntimeError('check-run pagination required')
        for c in obj['check_runs']:
            au=c['output']['annotations_url']+'?per_page=100'
            anns=get(au) if c['output']['annotations_count'] else []
            if len(anns)>=100:raise RuntimeError('annotation pagination required')
            if anns:sources.append({'url':au,'kind':'check-annotations','records':len(anns)})
            checks.append(dict(id=c['id'],name=c['name'],status=c['status'],conclusion=c['conclusion'],details_url=c['details_url'],title=c['output']['title'],summary=c['output']['summary'],annotations=[pick(n,'path start_line end_line annotation_level message title') for n in anns]))
        out.append({'run_id':rid,'attempt':a['run']['run_attempt'],'source':u,'checks':checks,'limit':'current suite view; match check ID to job ID; old attempt may be absent; annotation has no per-attempt timestamp'})
    write(DATA/'start-refusal-evidence.json',out)
    selected=json.loads((ROOT/'runs.json').read_text())
    def commit(sha):
        u=API+'/commits/'+sha;o=get(u)
        if len(o.get('files',[]))>=300:raise RuntimeError('commit files pagination required')
        write(DATA/'commits'/(sha+'.json'),{'sha':sha,'source':u,'message':o['commit']['message'],'parents':[p['sha'] for p in o['parents']],'files':[pick(f,'filename status additions deletions') for f in o.get('files',[])]})
        return {'url':u,'kind':'commit-paths-and-message','head_sha':sha}
    with ThreadPoolExecutor(max_workers=5) as pool:sources.extend(pool.map(commit,sorted({r['head_sha'] for r in selected})))
    import base64
    for sha in sorted({r['head_sha'] for r in selected if r['pr']=='198'}):
        u=API+'/contents/package.json?ref='+sha;o=get(u)
        package=json.loads(base64.b64decode(o['content']))
        write(DATA/'packages'/(sha+'.json'),{'source':u,'git_blob_sha':o['sha'],'scripts':package.get('scripts',{})})
        sources.append({'url':u,'kind':'package-scripts','head_sha':sha})
    write(DATA/'sources.json',sorted({s['url']:s for s in sources}.values(),key=lambda s:s['url']))

def seconds(start,end):
    if not start or not end: return None
    return int((dt.datetime.fromisoformat(end.replace('Z','+00:00'))-dt.datetime.fromisoformat(start.replace('Z','+00:00'))).total_seconds())

def table(name, rows):
    write(ROOT/(name+'.json'), rows)
    with (ROOT/(name+'.csv')).open('w',encoding='utf-8',newline='') as f:
        if rows:
            w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

def calculate():
    runs={}
    prs=json.loads((DATA/'pulls.json').read_text())
    for p in sorted(DATA.glob('runs-page-*.json')):
        for r in json.loads(p.read_text())['runs']:
            numbers,evidence=associate(r,prs)
            if START <= r['created_at'] < END and set(numbers) & {193,198}: runs[r['id']]=dict(r,pr_numbers=numbers,pr_association=evidence)
    rr=[]
    for r in sorted(runs.values(),key=lambda r:r['id']):
        rr.append(dict(pr=','.join(map(str,r['pr_numbers'])),pr_association=r['pr_association'],**{k:r[k] for k in RUNKEYS.split()},source=API+'/actions/runs/'+str(r['id'])))
    ar,jr=[],[]
    refusal_path=DATA/'start-refusal-evidence.json'
    refusals=json.loads(refusal_path.read_text()) if refusal_path.exists() else []
    refused_ids={c['id'] for a in refusals for c in a['checks'] if any('job was not started' in (n['message'] or '').lower() for n in c['annotations'])}
    refused_runs={a['run_id'] for a in refusals if any(c['id'] in refused_ids for c in a['checks'])}
    seen=set()
    for p in sorted(DATA.glob('attempt-*.json')):
        x=json.loads(p.read_text());r=x['run']
        if r['id'] not in runs:continue
        a=dict(run_id=r['id'],attempt=r['run_attempt'],pr=','.join(map(str,x['pr_numbers'])),workflow=r['name'],workflow_path=r['path'],head_sha=r['head_sha'],status=r['status'],conclusion=r['conclusion'],created_at=r['created_at'],run_started_at=r['run_started_at'],updated_at=r['updated_at'],observed_span_seconds=seconds(r['run_started_at'],r['updated_at']),source=x['source'],jobs=len(x['jobs']))
        ar.append(a)
        for j in x['jobs']:
            key=(r['id'],r['run_attempt'],j['id'])
            if key in seen:continue
            seen.add(key)
            executed=bool(j['steps'])
            classification='executed' if executed else ('skipped' if j['conclusion']=='skipped' else 'no_steps_unconfirmed')
            if not executed and j['id'] in refused_ids:classification='start_refused_annotation'
            elif not executed and r['id'] in refused_runs:classification='no_steps_refusal_inferred_same_run'
            duration=seconds(j['started_at'],j['completed_at'])
            jr.append(dict(run_id=r['id'],attempt=r['run_attempt'],job_id=j['id'],pr=a['pr'],workflow=r['name'],workflow_path=r['path'],head_sha=r['head_sha'],name=j['name'],status=j['status'],conclusion=j['conclusion'],classification=classification,started_at=j['started_at'],completed_at=j['completed_at'],api_span_seconds=duration,executed_seconds=duration if executed else 0,runner_id=j['runner_id'],runner_name=j['runner_name'],runner_group_name=j['runner_group_name'],labels=json.dumps(j['labels']),step_count=len(j['steps']),steps_evidence='snapshot/'+p.name,source=j['html_url'],limit='step evidence proves execution, API elapsed span includes setup/teardown; no billing or agent identity' if executed else 'no steps; require check annotation before calling start refused'))
    table('runs',rr);table('attempts',ar);table('jobs',jr)
    groups={}
    for j in jr:
        key=j['pr']+' / '+j['workflow']
        g=groups.setdefault(key,dict(jobs=0,executed_jobs=0,executed_seconds=0,no_steps_jobs=0,no_steps_span_seconds=0))
        g['jobs']+=1
        if j['classification']=='executed':g['executed_jobs']+=1;g['executed_seconds']+=j['executed_seconds'] or 0
        else:g['no_steps_jobs']+=1;g['no_steps_span_seconds']+=j['api_span_seconds'] or 0
    summary=dict(runs=len(rr),attempts=len(ar),jobs=len(jr),executed_jobs=sum(j['classification']=='executed' for j in jr),executed_seconds=sum(j['executed_seconds'] or 0 for j in jr),unknown_executed_duration_jobs=[j['job_id'] for j in jr if j['classification']=='executed' and j['executed_seconds'] is None],groups=groups,previous_report=dict(runs=47,attempts=48,jobs=85,executed_jobs=75,executed_seconds=11471))
    summary['delta']={k:summary[k]-v for k,v in summary['previous_report'].items()}
    write(ROOT/'summary.json',summary)
    overlaps=[]
    for j in jr:
        if j['classification']!='executed':continue
        current=runs[j['run_id']]
        candidates=[r for r in runs.values() if r['id']!=current['id'] and r['pr_numbers']==current['pr_numbers'] and r['workflow_id']==current['workflow_id'] and r['head_sha']!=current['head_sha'] and r['created_at']>current['created_at'] and r['created_at']<j['completed_at']]
        if not candidates:continue
        nxt=min(candidates,key=lambda r:r['created_at'])
        span=seconds(max(j['started_at'],nxt['created_at']),j['completed_at'])
        if span>0:overlaps.append(dict(run_id=j['run_id'],job_id=j['job_id'],pr=j['pr'],workflow=j['workflow'],newer_run_id=nxt['id'],newer_sha=nxt['head_sha'],newer_created_at=nxt['created_at'],job_started_at=j['started_at'],job_completed_at=j['completed_at'],post_newer_creation_seconds=span,limit='upper bound of elapsed job time after newer different SHA run creation; not avoidable time or billing savings'))
    table('overlaps',overlaps)
    bykey={}
    for j in jr:
        if j['classification']=='executed':bykey.setdefault((j['pr'],j['workflow'],j['head_sha']),set()).add(j['run_id'])
    write(ROOT/'repeat-and-overlap-summary.json',{'overlap_seconds':sum(o['post_newer_creation_seconds'] for o in overlaps),'overlap_job_count':len(overlaps),'executed_same_sha_multiple_runs':[dict(pr=k[0],workflow=k[1],sha=k[2],runs=sorted(v)) for k,v in bykey.items() if len(v)>1],'refusal_annotation_job_ids':sorted(refused_ids),'no_step_classifications':{c:sum(j['classification']==c for j in jr) for c in sorted({j['classification'] for j in jr if j['classification']!='executed'})}})
    print(json.dumps(summary,indent=2))

def manifest():
    files=sorted(p for p in ROOT.rglob('*') if p.is_file() and p.name!='SHA256SUMS' and '__pycache__' not in p.parts and p.name!='probe.json')
    (ROOT/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(ROOT).as_posix()+'\n' for p in files),encoding='utf-8')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--collect',action='store_true');parser.add_argument('--context',action='store_true');parser.add_argument('--manifest',action='store_true');args=parser.parse_args()
    if args.collect:collect()
    calculate()
    if args.context:context();calculate()
    if args.manifest:manifest()
