import {env} from 'cloudflare:workers';
import {cms} from '../../../lib/cms.mjs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>cms(request,env);
export const POST=GET;export const PUT=GET;export const PATCH=GET;