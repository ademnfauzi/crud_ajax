<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Barang_model extends CI_Model {
    public function getBarang(){
        return $this->db->get('barang')->result();
    }
    public function addBarang(){
        $nama = $this->input->post('nama');
        $harga = $this->input->post('harga_satuan');
        $jumlah = $this->input->post('jumlah');
        $keterangan = $this->input->post('keterangan');

        $data = [
            'nama' => $nama,
            'harga_satuan' => $harga,
            'jumlah' => $jumlah,
            'keterangan' => $keterangan
        ];

        $this->db->insert('barang', $data);
    }
    public function getBarangById($table,$where){
        return $this->db->get_where($table,$where);
    }
    public function updateBarang(){
        $id = $this->input->post('id');
        $nama = $this->input->post('nama');
        $harga = $this->input->post('harga_satuan');
        $jumlah = $this->input->post('jumlah');
        $keterangan = $this->input->post('keterangan');

        $data = [
            'id' => $id,
            'nama' => $nama,
            'harga_satuan' => $harga,
            'jumlah' => $jumlah,
            'keterangan' => $keterangan
        ];
        $this->db->where('id', $id);
        $this->db->update('barang',$data);
    }
    public function deleteData($where,$table){
        $this->db->where($where);
        $this->db->delete($table);
    }
}